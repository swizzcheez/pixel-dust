"""
models.py

App Engine datastore models

"""


from google.appengine.ext import ndb
import json

class PuzzleSolution(ndb.Model):
    '''
    Represents a puzzle solution.
    '''

    name = ndb.StringProperty(required=True)
    description = ndb.TextProperty(required=True)
    width = ndb.IntegerProperty(required=True)
    author = ndb.UserProperty()
    created = ndb.DateTimeProperty(auto_now_add=True)
    updated = ndb.DateTimeProperty(auto_now=True)
    data = ndb.TextProperty(required=True)

    def to_meta(self):
        meta = {
            'name': self.name,
            'description': self.description,
            'width': self.width,
            'author': self.author,
            'created': self.created,
            'updated': self.updated,
        }
        meta.update(json.loads(self.data))
        return meta

TEST_PUZZLES = dict(
    square = PuzzleSolution(
        name='square',
        description='A square',
        width=8,
        data=json.dumps({
            'colors':
            {
                '': [ 0, 0, 0 ],
                '*': [ 0, 0, 255 ],
                ' ': [ 255, 128, 255 ],
            },
            'pixels':
            [
                '        ',
                ' ****** ',
                ' *    * ',
                ' *    * ',
                ' *    * ',
                ' *    * ',
                ' ****** ',
                '        ',
            ],
        })
    )
)

