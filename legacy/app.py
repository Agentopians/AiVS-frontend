from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/chat', methods=['POST', 'GET'])
def chat():
    return jsonify({"text": """To effectively collect evidence for a case, the following types of evidence are often essential:

1. **Contracts or Agreements**: Copies of relevant contracts or agreements that outline the terms under dispute.
2. **Correspondence**: Emails, letters, or messages exchanged between parties that may clarify intentions or agreements.
3. **Witness Statements**: Accounts from individuals who have relevant information about the situation.
4. **Financial Records**: Bank statements, invoices, or transaction records that directly relate to the case.
5. **Photographic or Video Evidence**: Images or recordings that may illustrate key events or conditions.
6. **Digital Evidence**: Data from devices, online activities, or logs that may provide context or proof regarding the case.

Please let me know if you have any specific evidence available, and I can assist further in organizing it for your application."""})

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
    
    return jsonify({"text": """To effectively collect evidence for a case, the following types of evidence are often essential:

1. **Contracts or Agreements**: Copies of relevant contracts or agreements that outline the terms under dispute.
2. **Correspondence**: Emails, letters, or messages exchanged between parties that may clarify intentions or agreements.
3. **Witness Statements**: Accounts from individuals who have relevant information about the situation.
4. **Financial Records**: Bank statements, invoices, or transaction records that directly relate to the case.
5. **Photographic or Video Evidence**: Images or recordings that may illustrate key events or conditions.
6. **Digital Evidence**: Data from devices, online activities, or logs that may provide context or proof regarding the case.

Please let me know if you have any specific evidence available, and I can assist further in organizing it for your application."""})

if __name__ == '__main__':
    print("V13")
    app.run(host='0.0.0.0', port=3000, debug=True)