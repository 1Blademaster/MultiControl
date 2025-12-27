from flask import Blueprint

from . import actions as actions
from . import connection as connection

endpoints = Blueprint("endpoints", __name__)
