import httpx
import json
import os
import asyncio
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from openai import AsyncOpenAI

# Load environment variables
load_dotenv()

# Initialize OpenAI Client (Reusing env vars)
# Note: Ideally this should be passed from main.py, but for modularity we init here.
api_key = os.getenv("OPENAI_API_KEY")
base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")

client = None
if api_key:
    client = AsyncOpenAI(api_key=api_key, base_url=base_url)

async def search_articles(query: str, limit: int = 3) -> List[Dict[str, Any]]:
    """
    Search for scholarly articles using the OpenAlex API.
    Returns a list of formatted article dictionaries.
    async implementation using httpx to prevent blocking the event loop.
    """
    try:
        base_url = "https://api.openalex.org/works"
        params = {
            "search": query,
            "per_page": limit,
            "select": "display_name,publication_date,authorships,primary_location,abstract_inverted_index,doi"
        }
        
        headers = {
            'User-Agent': 'MentalHealthChatbot/1.0 (mailto:azy@example.com)'
        }
        
        async with httpx.AsyncClient() as http_client:
            print(f"DEBUG: Querying OpenAlex: {base_url} with params {params}")
            response = await http_client.get(base_url, params=params, headers=headers)
            
            print(f"DEBUG: OpenAlex Status: {response.status_code}")
            
            if response.status_code != 200:
                print(f"DEBUG: OpenAlex Error Body: {response.text}")
                return []
                
            data = response.json()
            results = data.get('results', [])
            print(f"DEBUG: Found {len(results)} raw results")
            
            # Format articles first
            formatted_articles = []
            for item in results:
                article = format_article(item)
                if article:
                    formatted_articles.append(article)
            
            # Run Quality Assessment in Parallel
            if client and formatted_articles:
                print("DEBUG: Starting AI Quality Assessment...")
                assessment_tasks = [assess_quality(article) for article in formatted_articles]
                assessed_articles = await asyncio.gather(*assessment_tasks)
                print(f"DEBUG: Returning {len(assessed_articles)} assessed formatted articles")
                return assessed_articles
            
            print(f"DEBUG: Returning {len(formatted_articles)} formatted articles (No AI Assessment)")
            return formatted_articles

    except Exception as e:
        print(f"DEBUG: EXCEPTION in search_articles: {e}")
        import traceback
        traceback.print_exc()
        return []

async def assess_quality(article: Dict[str, Any]) -> Dict[str, Any]:
    """
    Uses LLM to assess the quality of the research article based on its abstract.
    Attributes: Methodological Rigor, Novelty, Clarity, Ethical Conduct.
    """
    try:
        abstract = article.get("description", "")
        if not abstract or len(abstract) < 50:
            article["quality_score"] = 0
            article["quality_reasoning"] = "Abstract too short for assessment."
            return article

        prompt = f"""
        Analyze the following research abstract for scientific quality.
        
        Criteria:
        1. Methodological Rigor (Design, Logic)
        2. Novelty & Significance
        3. Clarity of Presentation
        4. Ethical Conduct
        
        Abstract:
        "{abstract[:4000]}"
        
        Output valid JSON only:
        {{
            "score": <integer 0-100>,
            "reasoning": "<concise 1-sentence summary of why>"
        }}
        """
        
        response = await client.chat.completions.create(
            model="js2/llama-4-scout", # Updated to use supported model
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        result = json.loads(content)
        
        article["quality_score"] = result.get("score", 50)
        article["quality_reasoning"] = result.get("reasoning", "Assessment details unavailable.")
        
    except Exception as e:
        print(f"Error assessing quality for '{article.get('title')}': {e}")
        article["quality_score"] = -1 # Error indicator
        article["quality_reasoning"] = "AI Assessment Failed."
        
    return article

def format_article(item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Format a raw OpenAlex result into a clean dictionary.
    """
    try:
        # Get basic info
        title = item.get('display_name', 'Untitled Article')
        date = item.get('publication_date', 'Unknown Date')
        
        # Get authors
        authorships = item.get('authorships', [])
        author_names = []
        for auth in authorships:
            author_obj = auth.get('author', {})
            name = author_obj.get('display_name')
            if name:
                author_names.append(name)
        
        # Limit to first 3 authors + et al if needed
        if len(author_names) > 3:
            authors_str = ", ".join(author_names[:3]) + " et al."
        else:
            authors_str = ", ".join(author_names) if author_names else "Unknown Authors"

        # Get Link
        primary_loc = item.get('primary_location') or {}
        link = primary_loc.get('landing_page_url') or primary_loc.get('pdf_url') or item.get('doi')
        
        # Reconstruct abstract
        abstract = reconstruct_abstract(item.get('abstract_inverted_index'))
        if not abstract:
            abstract = "No abstract available."
        
        # Truncate abstract if too long
        # Note: We keep full abstract for analysis but might truncate for display
        # Let's keep a truncated version for display, but maybe store full for AI? 
        # For now, let's just stick to the display truncation logic from before, 
        # but the AI assesses the RECONSTRUCTED abstract before truncation in a better world.
        # However, to avoid complexity, I will reconstruct it, and if I truncate it here logic breaks.
        # Let's truncate AFTER analysis? No, format_article is called BEFORE assess_quality now.
        # I'll just change logic to truncate for display but maybe keep full text?
        # Actually simplest is just assess the truncated text if it's long enough, 
        # OR better: don't truncate in format_article! 
        # Wait, the user wants the display to look good.
        # I will keep the truncation for now. 300 chars is very short for AI analysis though.
        # I will increase truncation limit to 800 chars to give AI more context while keeping UI okay.
        
        if len(abstract) > 800:
            display_abstract = abstract[:797] + "..."
        else:
            display_abstract = abstract

        return {
            "title": title,
            "date": date,
            "authors": authors_str,
            "link": link,
            "description": display_abstract
        }
    except Exception as e:
        print(f"Error formatting article: {e}")
        return None

def reconstruct_abstract(inverted_index: Optional[Dict[str, List[int]]]) -> str:
    """
    Reconstruct abstract from OpenAlex's inverted index format.
    """
    if not inverted_index:
        return ""
        
    try:
        # Create a list of None with length equal to max index + 1
        max_index = 0
        for indices in inverted_index.values():
            if indices:
                max_index = max(max_index, max(indices))
        
        words = [""] * (max_index + 1)
        
        for word, indices in inverted_index.items():
            for idx in indices:
                words[idx] = word
                
        return " ".join(words)
    except Exception:
        return ""
