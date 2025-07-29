import os
import logging
from fastapi import FastAPI, Request, Form, Depends, HTTPException
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Define templates
career_counselor_template = """
You are a helpful and knowledgeable career counselor.
Your task is to guide individuals in finding the best career based on their skills, interests, and experience.
Provide suggestions for possible career paths, discuss the job market trends, and suggest qualifications they should pursue.

Here is the conversation history:
{hicontext}
Question: {question}
Answer:
"""

general_chat_template = """
You are a friendly and conversational AI assistant.
Feel free to engage in light-hearted conversations, provide general knowledge, and answer various questions.

Here is the conversation history:
{hicontext}
Question: {question}
Answer:
"""

# Instantiate the Gemini chat model
model = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0)

# Store user contexts and selected templates
user_contexts = {}
user_templates = {}

# Function to select the appropriate template
def select_template(template_name: str) -> ChatPromptTemplate:
    if template_name == 'career_counselor':
        return ChatPromptTemplate.from_template(career_counselor_template)
    elif template_name == 'general_chat':
        return ChatPromptTemplate.from_template(general_chat_template)
    else:
        return ChatPromptTemplate.from_template(general_chat_template)

# Create FastAPI app
app = FastAPI(title="AI Chatbot")

# Set up templates directory
templates = Jinja2Templates(directory="templates")

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Pydantic models for request validation
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    mode: Optional[str] = "general_chat"

class ChatResponse(BaseModel):
    response: str
    session_id: str

# Routes
@app.get("/", response_class=HTMLResponse)
async def get_chat_page(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/chat", response_model=ChatResponse)
async def chat(chat_request: ChatRequest):
    session_id = chat_request.session_id or str(hash(chat_request.message))
    user_input = chat_request.message
    
    # Check if the user wants to change the template
    if user_input.lower() == 'career mode':
        user_templates[session_id] = 'career_counselor'
        return ChatResponse(
            response="Switched to Career Counselor mode. How can I assist you with career guidance?",
            session_id=session_id
        )
    elif user_input.lower() == 'chat mode':
        user_templates[session_id] = 'general_chat'
        return ChatResponse(
            response="Switched to General Chat mode. Feel free to ask me anything!",
            session_id=session_id
        )

    # Get or initialize the user's template and context
    selected_template = user_templates.get(session_id, chat_request.mode)
    prompt = select_template(selected_template)
    context_history = user_contexts.get(session_id, "")

    # Format the prompt with conversation history and user input
    prompt_text = prompt.format(hicontext=context_history, question=user_input)

    # Create a HumanMessage list for the Gemini model
    messages = [HumanMessage(content=prompt_text)]

    try:
        # Invoke the Gemini chat model
        result = model.invoke(messages)
        
        # Update the conversation history
        context_history += f"\nUser: {user_input}\nAI: {result.content}"
        user_contexts[session_id] = context_history
        
        return ChatResponse(
            response=result.content,
            session_id=session_id
        )
    except Exception as e:
        logger.error(f"Error invoking AI model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reset")
async def reset_chat(session_id: str = Form(...)):
    if session_id in user_contexts:
        user_contexts[session_id] = ""
    return {"status": "success", "message": "Chat history reset successfully"}

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)