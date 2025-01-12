# how to run

```
python server.py 
```

to check the server is running
```
curl -v -X POST -H "Content-Type: application/json" -d '{"turnHistory":[[30,45,20],[25,35,40]], "playerColors":["#FF6384","#36A2EB"]}' http://localhost:5001/update_graph

curl -v -X POST -H "Content-Type: application/json" -d '{"game_id":38,"player_number":1,"turn_number":0,"duration":3,"bank_time_used":52,"penalties":0,"adventure_cards":0}' http://localhost:5001/turn/record
```

in separate terminal
```
python -m http.server 8000
```


requirements

```
pip install flask flask-cors plotly flask-sqlalchemy apscheduler
```
