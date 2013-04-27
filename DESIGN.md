Gameplay Overview
=================

1. Computer picks simplified, pixelated goal image
1. Computer reduces image to 2x2 picture
1. Player is presented with 2x2 grid
1. Player then plays Mastermind using that grid
1. Once successful, player can then proceed to solve inner grids
1. The player will eventually guess the picture in which case solutions
    should be quick.

Architecture
============

This has the feel of a webapp.  The game needs to facilitate:

1. Some editor for inputting puzzles
1. A means to organize and randomly select puzzles to play
1. A way to play the game
1. Some sort of scoreboard (optional)

These all sound like RESTful services.

So, it comes down to web platform then.  To help reduce risk, I'm going to
use Python since I know it well.

The major platforms I'm most familar with in Python are Django and Flask.
One consideration is hosting on GAE, which I haven't done in a while.  GAE
most directly supports Django, but I really like Flask's simplified style
and Jinja2's flexibility.

Based on [this article]
(http://f.souza.cc/2010/08/flying-with-flask-on-google-app-engine.html), 
I'm going to assume I can deploy Flask on GAE, but this is an early risk 
area so **it should be vetted right away as part of setting up the 
environment**.

Choosing GAE also handles the database, deployment, and scalability 
questions easily.

URL Design
==========

Puzzle Storage
--------------

* / or index
  * GET returns a summary indicating how to edit (if logged in) or play a game
* puzzle/random?...
  * GET will redirect to puzzle player of random puzzle that matches criteria
* puzzle/AUTHOR
  * GET returns a list of puzzles for that author (in either JSON or HTML)
  * POST adds a new puzzle for that author
* puzzle/AUTHOR/ID
  * GET of */json produces the board information
  * GET of HTML redirects to .../player
  * PUT updates the stored board
  * .../player
    * GET returns a game board that uses the puzzle/AUTHOR/ID
  * .../editor
    * GET returns a board editor for that puzzle/AUTHOR/ID

Scoreboard will be designed if I have time.
