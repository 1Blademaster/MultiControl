from flask import Blueprint

from . import connection as connection

endpoints = Blueprint("endpoints", __name__)
