from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/chat', methods=['POST', 'GET'])
def chat():
    # print("Headers:", request.headers, flush=True)
    print("Method:", request.method, flush=True)
    print("Args:", request.args, flush=True)
    print("Form Data:", request.form, flush=True)
    print("Raw Data:", request.data, flush=True)
    
    try:
        data = request.get_json()
    except Exception as e:
        print("JSON Parse Error:", e)
        return jsonify({"error": "Invalid request JSON parsing"}), 200
    
    print("Parsed JSON:", data, flush=True)
    
    if not data or 'text' not in data:
        return jsonify({"error": "Invalid request no text provided"}), 200
    
    return jsonify({"text": data.get('text', 'No text provided')})

if __name__ == '__main__':
    print("V9")
    app.run(host='0.0.0.0', port=3000, debug=True)