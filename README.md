# AI Chatbot with FastAPI

This is a simple AI chatbot built with FastAPI and Google's Gemini AI model. The chatbot has two modes: General Chat and Career Counselor.

## Features

- Web-based chat interface
- Two conversation modes:
  - General Chat: For casual conversations and general questions
  - Career Counselor: For career advice and guidance
- Session management to maintain conversation context
- Responsive design that works on desktop and mobile devices

## Prerequisites

- Python 3.8 or higher
- Google API key for Gemini AI

## Installation

1. Clone this repository or download the source code

2. Create and activate a virtual environment (recommended):

```bash
python -m venv .venv
.venv\Scripts\activate  # On Windows
source .venv/bin/activate  # On macOS/Linux
```

3. Install the required dependencies:

```bash
pip install -r requirements.txt
```

4. Set your Google API key in the `app.py` file or as an environment variable:

```python
os.environ["GOOGLE_API_KEY"] = "your-api-key-here"
```

## Running the Application

Start the FastAPI server:

```bash
python app.py
```

Or use uvicorn directly:

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Then open your browser and navigate to `http://localhost:8000`

## API Endpoints

- `GET /`: The main chat interface
- `POST /chat`: API endpoint for sending and receiving chat messages
- `POST /reset`: API endpoint for resetting a chat session

## Usage

1. Type your message in the input field and press Enter or click the Send button
2. To switch between chat modes, use the dropdown menu in the top right corner or type "chat mode" or "career mode"
3. To reset the conversation, click the Reset button

## License

This project is open source and available under the MIT License.