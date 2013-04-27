"""
views.py

URL route handlers

Note that any handler params must match the URL route params.
For example the *say_hello* handler, handling the URL route '/hello/<username>',
  must be passed *username* as the argument.

"""
from google.appengine.api import users
from google.appengine.runtime.apiproxy_errors import CapabilityDisabledError

from flask import request, render_template, flash, url_for, redirect

from flask_cache import Cache

from pixel_dust import app
from decorators import login_required, admin_required
#from forms import ExampleForm
from models import PuzzleSolution, TEST_PUZZLES
import json

# Flask-Cache (configured to use App Engine Memcache API)
cache = Cache(app)

def home():
    return render_template('home.html')

def puzzle_data(group, id):
    if group == 'TEST':
        puzzle = TEST_PUZZLES.get(id)
    else:
        puzzle = None
    if puzzle is None:
        pass
    if 'application/json' in request.accept_mimetypes:
        return json.dumps(puzzle.to_meta())
    else:
        return render_template('puzzle/view.html',
                               puzzle=puzzle, group=group, id=id)

def puzzle_player(group, id):
    return render_template('puzzle/player.html',
                           puzzle_url=url_for('puzzle_data',
                                              group=group, id=id))

def warmup():
    """App Engine warmup handler
    See http://code.google.com/appengine/docs/python/config/appconfig.html#Warming_Requests

    """
    return ''

