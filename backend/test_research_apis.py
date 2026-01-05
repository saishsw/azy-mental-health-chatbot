from research import search_articles
import json

def test_research_module():
    print("Testing research module...")
    try:
        results = search_articles("mental health", limit=2)
        print(f"Found {len(results)} articles.")
        print(json.dumps(results, indent=2))
        
        if len(results) > 0 and 'title' in results[0]:
            print("SUCCESS: Articles retrieved and formatted correctly.")
        else:
            print("FAILURE: No results or incorrect format.")
            
    except Exception as e:
        print(f"Test Failed: {e}")

if __name__ == "__main__":
    test_research_module()
