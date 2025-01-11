from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Player(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

class Game(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    start_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    end_time = db.Column(db.DateTime)
    player_count = db.Column(db.Integer, nullable=False)
    turns = db.relationship('Turn', backref='game', lazy=True)

class Turn(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey('game.id'), nullable=False)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    player = db.relationship('Player', backref='turns')
    player_number = db.Column(db.Integer, nullable=False)
    turn_number = db.Column(db.Integer, nullable=False)
    duration = db.Column(db.Integer, nullable=False)
    bank_time_used = db.Column(db.Integer, default=0)
    penalties = db.Column(db.Integer, default=0)
    adventure_cards = db.Column(db.Integer, default=0)
    

