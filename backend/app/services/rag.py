import re
import math
from collections import Counter

STOP_WORDS = {
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent', 'as', 'at',
    'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'cant', 'cannot', 'could',
    'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down', 'during', 'each', 'few', 'for', 'from',
    'further', 'had', 'hadnt', 'has', 'hasnt', 'have', 'havent', 'having', 'he', 'hed', 'hell', 'hes', 'her', 'here',
    'heres', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'hows', 'i', 'id', 'ill', 'im', 'ive', 'if', 'in',
    'into', 'is', 'isnt', 'it', 'its', 'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor',
    'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
    'same', 'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such', 'than', 'that', 'thats',
    'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres', 'these', 'they', 'theyd', 'theyll',
    'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasnt', 'we',
    'wed', 'well', 'were', 'weve', 'werent', 'what', 'whats', 'when', 'whens', 'where', 'wheres', 'which', 'while',
    'who', 'whos', 'whom', 'why', 'whys', 'with', 'wont', 'would', 'wouldnt', 'you', 'youd', 'youll', 'youre', 'youve',
    'your', 'yours', 'yourself', 'yourselves'
}

def tokenize(text):
    text = text.lower()
    words = re.findall(r'\b[a-z]{2,}\b', text)
    return [w for w in words if w not in STOP_WORDS]

def get_relevant_chunks(contract_text: str, query: str, top_k: int = 3) -> list:
    """
    Slices the contract text into semantic paragraphs and retrieves the top_k
    most relevant sections matching the query using pure-Python TF-IDF rank-matching.
    """
    if not contract_text:
        return []
    
    # 1. Clean and chunk by double newlines or single paragraphs
    raw_chunks = [c.strip() for c in contract_text.split('\n') if c.strip()]
    
    # Group short clauses/lines to ensure proper context block sizes
    chunks = []
    temp_chunk = ""
    for chunk in raw_chunks:
        if len(temp_chunk) + len(chunk) < 500:
            temp_chunk += "\n" + chunk if temp_chunk else chunk
        else:
            chunks.append(temp_chunk)
            temp_chunk = chunk
    if temp_chunk:
        chunks.append(temp_chunk)
        
    if not chunks:
        return []
        
    # 2. Tokenize and index vocabulary frequency
    tokenized_chunks = [tokenize(c) for c in chunks]
    
    # Document frequency
    all_words = set()
    for tokens in tokenized_chunks:
        all_words.update(tokens)
        
    df = {}
    for word in all_words:
        df[word] = sum(1 for tokens in tokenized_chunks if word in tokens)
        
    num_docs = len(chunks)
    idf = {}
    for word, count in df.items():
        idf[word] = math.log((1 + num_docs) / (1 + count)) + 1
        
    # 3. Calculate TF-IDF vectors for document chunks
    chunk_vectors = []
    for tokens in tokenized_chunks:
        tf = Counter(tokens)
        vector = {}
        for word, count in tf.items():
            vector[word] = count * idf.get(word, 0)
        chunk_vectors.append(vector)
        
    # 4. Calculate TF-IDF vector for the query
    query_tokens = tokenize(query)
    query_tf = Counter(query_tokens)
    query_vector = {}
    for word, count in query_tf.items():
        query_vector[word] = count * idf.get(word, 0)
        
    query_norm = math.sqrt(sum(v**2 for v in query_vector.values()))
    if query_norm == 0:
        # If query has no vocabulary overlaps, fallback to returning the first top_k chunks
        return chunks[:top_k]
        
    # 5. Compute cosine similarities
    scores = []
    for i, chunk_vector in enumerate(chunk_vectors):
        dot_product = sum(query_vector.get(word, 0) * chunk_vector.get(word, 0) for word in chunk_vector)
        chunk_norm = math.sqrt(sum(v**2 for v in chunk_vector.values()))
        
        if chunk_norm == 0:
            similarity = 0.0
        else:
            similarity = dot_product / (query_norm * chunk_norm)
            
        scores.append((similarity, chunks[i]))
        
    # Sort descending
    scores.sort(key=lambda x: x[0], reverse=True)
    
    return [chunk for score, chunk in scores[:top_k]]
