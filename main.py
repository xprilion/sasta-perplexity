from flask import Flask, jsonify, request
from qdrant_client import QdrantClient
import os
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app)

collection_name = 'search_data'

@app.route('/')
def home():
    return 'Welcome to the API'

@app.route('/search', methods=['POST'])
def search():
    data = request.get_json()
    query = data.get('query')
    content_type = data.get('content_type')
    client = QdrantClient(url=os.getenv('QDRANT_URL'), api_key=os.getenv('QDRANT_API_KEY'), port=None)
    search_result = client.query(collection_name=collection_name, query_text=query, limit=5, query_filter={
        "must": [
            {
                "key": "content_type",
                "match": {
                    "value": content_type
                }
            }
        ]
    })
    
    results = []
    for result in search_result:
        results.append({
            "id": result.id,
            "document": result.document,
            "metadata": result.metadata
        })

    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
