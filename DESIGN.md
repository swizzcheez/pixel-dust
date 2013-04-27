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
use Python.

