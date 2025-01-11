# how to run

```
python server.py 
```

to check the server is running
```
curl -v -X POST -H "Content-Type: application/json" -d '{"turnHistory":[[30,45,20],[25,35,40]], "playerColors":["#FF6384","#36A2EB"]}' http://localhost:5001/update_graph
```

in separate terminal
```
python -m http.server 8000
```


requirements

```
pip install flask flask-cors plotly flask-sqlalchemy apscheduler
```