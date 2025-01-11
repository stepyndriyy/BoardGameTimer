from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, Game, Turn, Player
import plotly.graph_objects as go
from datetime import datetime
import shutil
from apscheduler.schedulers.background import BackgroundScheduler
import os
import glob


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///scythe_timer.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()


# @app.route('/backup', methods=['POST'])
# def backup_database():
#     timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
#     backup_path = f'backups/scythe_timer_{timestamp}.db'
#     shutil.copy2('instance/scythe_timer.db', backup_path)
#     return jsonify({'status': 'success', 'backup_path': backup_path})

# scheduler = BackgroundScheduler()
# scheduler.add_job(func=backup_database, trigger="interval", minutes=5)
# scheduler.start()


@app.route('/game/start', methods=['POST'])
def start_game():
    data = request.json
    new_game = Game(player_count=data['playerCount'])
    db.session.add(new_game)
    db.session.commit()
    return jsonify({'game_id': new_game.id})


@app.route('/game/end/<int:game_id>', methods=['POST'])
def end_game(game_id):
    game = Game.query.get_or_404(game_id)
    game.end_time = datetime.utcnow()
    db.session.commit()
    return jsonify({'status': 'success'})


@app.route('/turn/record', methods=['POST'])
def record_turn():
    data = request.json
    new_turn = Turn(
        game_id=data['game_id'],
        player_number=data['player_number'],
        turn_number=data['turn_number'],
        duration=data['duration'],
        bank_time_used=data['bank_time_used'],
        penalties=data['penalties'],
        adventure_cards=data['adventure_cards']
    )
    db.session.add(new_turn)
    db.session.commit()
    return jsonify({'status': 'success'})


@app.route('/update_graph', methods=['POST'])
def update_graph():
    data = request.json
    turn_history = data['turnHistory']
    player_colors = data['playerColors']
    player_names = data['playerNames']
    
    fig = go.Figure()
    for player_idx, turns in enumerate(turn_history):
        fig.add_trace(go.Scatter(
            x=list(range(len(turns))),
            y=turns,
            mode='lines+markers',
            name=player_names[player_idx],
            line=dict(color=player_colors[player_idx])
        ))
    
    fig.update_layout(
        title='Turn Times by Player',
        xaxis_title='Turn Number',
        yaxis_title='Time (seconds)'
    )
    
    return jsonify(fig.to_dict())


@app.route('/stats', methods=['GET'])
def get_stats():
    games = Game.query.all()
    stats = []
    for game in games:
        game_data = {
            'id': game.id,
            'start_time': game.start_time,
            'end_time': game.end_time,
            'player_count': game.player_count,
            'turns': [{
                'player_number': turn.player_number,
                'turn_number': turn.turn_number,
                'duration': turn.duration,
                'penalties': turn.penalties,
                'adventure_cards': turn.adventure_cards
            } for turn in game.turns]
        }
        stats.append(game_data)
    return jsonify(stats)


@app.route('/players', methods=['GET'])
def get_players():
    players = Player.query.all()
    return jsonify([{'id': p.id, 'username': p.username} for p in players])

@app.route('/players', methods=['POST'])
def add_player():
    data = request.json
    if Player.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    player = Player(username=data['username'])
    db.session.add(player)
    db.session.commit()
    return jsonify({'id': player.id, 'username': player.username})


# def load_latest_backup():
#     backup_files = glob.glob('backups/scythe_timer_*.db')
#     if backup_files:
#         latest_backup = max(backup_files, key=os.path.getctime)
#         # if os.path.exists('scythe_timer.db'):
#         #     timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
#         #     os.rename('scythe_timer.db', f'scythe_timer_old_{timestamp}.db')
#         shutil.copy2(latest_backup, 'instance/scythe_timer.db')
#         return True
#     return False


if __name__ == '__main__':
    # load_latest_backup()
    app.run(port=5001)
