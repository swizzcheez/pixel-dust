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

    group = ndb.StringProperty(required=True)
    name = ndb.StringProperty(required=True)
    hint = ndb.TextProperty()
    width = ndb.IntegerProperty(required=True)
    author = ndb.UserProperty()
    created = ndb.DateTimeProperty(auto_now_add=True)
    updated = ndb.DateTimeProperty(auto_now=True)
    data = ndb.TextProperty(required=True)

    def to_meta(self):
        created = self.created
        updated = self.updated
        meta = {
            'name': self.name,
            'hint': self.hint,
            'width': self.width,
            'author': self.author,
            'created': str(created),
            'updated': str(updated),
        }
        meta.update(json.loads(self.data))
        return meta

TEMPLATES = dict(
    default = PuzzleSolution(
        name='default',
        hint='Generic default',
        width=8,
        data=json.dumps({
            'colors':
            {
                ' ': 'black',
                'R': 'red',
                'G': 'green',
                'B': 'blue',
                'P': 'purple',
            },
            'pixels':
            [
                '        ',
                '        ',
                '        ',
                '        ',
                '        ',
                '        ',
                '        ',
                '        ',
            ]
        })
    ),
)

TEST_PUZZLES = dict(
    square = PuzzleSolution(
        name='square',
        hint='A square',
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

