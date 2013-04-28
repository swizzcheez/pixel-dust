"""
views.py

URL route handlers

Note that any handler params must match the URL route params.
For example the *say_hello* handler, handling the URL route '/hello/<username>',
  must be passed *username* as the argument.

"""
from google.appengine.ext import db
from google.appengine.api import users
from google.appengine.runtime.apiproxy_errors import CapabilityDisabledError

from flask import request, render_template, flash, url_for, redirect

from flask_cache import Cache

from pixel_dust import app
from decorators import login_required, admin_required
#from forms import ExampleForm
from models import PuzzleSolution, TEST_PUZZLES, TEMPLATES, Score
import json, random

# Flask-Cache (configured to use App Engine Memcache API)
cache = Cache(app)

def home():
    return render_template('home.html')

def puzzle_list(group):
    if request.method == 'POST':
        return redirect(url_for('puzzle_editor',
                                group=group, id=request.form['name']))
    else:
        puzzles = PuzzleSolution.query(PuzzleSolution.group==group)
        return render_template('puzzle/list.html', puzzles=puzzles)

def puzzle_data(group, id):
    puzzle = PuzzleSolution.query().filter(PuzzleSolution.name==id,
                                           PuzzleSolution.group==group).get()
    if request.method == 'POST':
        #_id = request.form.get('_id')
        #if _id is not None:
        #    puzzle = PuzzleSolution.get_by_id(_id)
        #    print _id, puzzle

        form = request.form
        width = height = int(form['size'])
        hint = form['hint']
        colors = {}
        for color_code in form.getlist('color'):
            colors[color_code] = form['color-' + color_code]
        pixels = []
        for y in range(height):
            row = ''
            for x in range(width):
                row += form['%d,%d' % (x, y)]
            pixels.append(row)

        if puzzle is None:
            puzzle = PuzzleSolution(group=group, name=id)
        else:
            puzzle.name = form['title']

        puzzle.width = int(form['size'])
        puzzle.hint = db.Text(hint)
        puzzle.author = users.get_current_user()
        puzzle.data = json.dumps(
        {
            'colors': colors,
            'pixels': pixels,
        })
        puzzle.put()
        return redirect(request.referrer)
    else:
        if puzzle is None:
            if group == 'TEST':
                puzzle = TEST_PUZZLES.get(id)
            if puzzle is None:
                if id == 'RANDOM':
                    puzzle_ids = (PuzzleSolution
                                    .query()
                                    .filter(PuzzleSolution.group==group)
                                    .fetch(keys_only=True))
                    pick = int(random.random() * len(puzzle_ids))
                    puzzle = puzzle_ids[pick].get()
            if puzzle is None:
                template = request.args.get('template')
                if template is not None:
                    puzzle = TEMPLATES.get(template)
                    puzzle.name = id

        if 'application/json' in request.accept_mimetypes:
            return json.dumps(
                puzzle.to_meta(reduced=request.args.get('reduced')))
        else:
            return render_template('puzzle/view.html',
                                   puzzle=puzzle, group=group, id=id)

def puzzle_player(group, id):
    return render_template('puzzle/player.html',
                           group=group, id=id,
                           puzzle_url=url_for('puzzle_data',
                                              reduced=True,
                                              group=group,
                                              id=id))

@admin_required
def puzzle_editor(group, id):
    return render_template('puzzle/editor.html',
                           name=id,
                           save_url=url_for('puzzle_data',
                                            group=group, id=id),
                           puzzle_url=url_for('puzzle_data',
                                              group=group, id=id,
                                              template='default'))

@login_required
def scoreboard(group, id=None):
    recorded = False
    if request.method == 'POST':
        Score(name=id, group=group,
              player=users.get_current_user(),
              score=int(request.form['score'])).put()
        return redirect(url_for('scoreboard',
                                group=group, id=id))
    # Return best scores.
    scores = Score.query().order(-Score.score).fetch(limit=20)
    if 'text/html' in request.accept_mimetypes:
        return render_template('scoreboard/scores.html',
                               scores=scores,
                               recorded=recorded)
    else:
        return json.dumps([score.to_meta() for score in scores])

def warmup():
    """App Engine warmup handler
    See http://code.google.com/appengine/docs/python/config/appconfig.html#Warming_Requests

    """
    return ''

