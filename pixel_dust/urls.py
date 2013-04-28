"""
urls.py

URL dispatch route mappings and error handlers

"""
from flask import render_template

from pixel_dust import app
from pixel_dust import views


## URL dispatch rules
# App Engine warm up handler
# See http://code.google.com/appengine/docs/python/config/appconfig.html#Warming_Requests
app.add_url_rule('/_ah/warmup', 'warmup', view_func=views.warmup)

# Home page
app.add_url_rule('/', 'home', view_func=views.home)

# Lists
app.add_url_rule('/puzzle/<group>/',
                 view_func=views.puzzle_list,
                 methods=['GET', 'POST'])

# Player
app.add_url_rule('/puzzle/<group>/<id>',
                 view_func=views.puzzle_data,
                 methods=['GET', 'POST'])
app.add_url_rule('/puzzle/<group>/<id>/player',
                 view_func=views.puzzle_player)

# Editor
app.add_url_rule('/puzzle/<group>/<id>/editor',
                 view_func=views.puzzle_editor)

# Scoreboard
app.add_url_rule('/scoreboard/<group>/',
                 view_func=views.scoreboard,
                 methods=['GET'])
app.add_url_rule('/scoreboard/<group>/<id>/',
                 view_func=views.scoreboard,
                 methods=['GET', 'POST'])
app.add_url_rule('/puzzle/<group>/<id>/scoreboard',
                 view_func=views.scoreboard,
                 methods=['GET', 'POST'])

## Error handlers
# Handle 404 errors
@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

# Handle 500 errors
@app.errorhandler(500)
def server_error(e):
    return render_template('500.html'), 500

