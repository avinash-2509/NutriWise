# Web-reference demo data

`demo_products.csv` contains 20 web-reference rows supplied by the developer. It exists only to demonstrate the product library, comparison, and recommendation workflows before genuine fieldwork records are available.

It is deliberately separate from the assignment's primary `data.csv`. Collection timestamps and locations are blank because they were not supplied. Inequalities such as `<1` and `<=14` are preserved in `source_notes` instead of being converted into invented exact numbers.

To run the backend with this optional demo dataset from PowerShell:

```powershell
cd backend
$env:NUTRIWISE_DATA_PATH='reference-data/demo_products.csv'
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Remove the environment variable or set it back to `data.csv` to use the official fieldwork dataset.
