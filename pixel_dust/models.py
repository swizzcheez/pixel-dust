"""
models.py

App Engine datastore models

"""


from google.appengine.ext import ndb


class PuzzleSolution(ndb.Model):
    '''
    Represents a puzzle solution.
    '''

    name = ndb.StringProperty(required=True)
    description = ndb.TextProperty(required=True)
    width = ndb.IntegerProperty(required=True)
    height = ndb.IntegerProperty(required=True)
    author = ndb.UserProperty()
    created = ndb.DateTimeProperty(auto_now_add=True)
    updated = ndb.DateTimeProperty(auto_now=True)

