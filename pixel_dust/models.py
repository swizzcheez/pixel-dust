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

    def to_meta(self, reduced=False):
        created = self.created
        updated = self.updated
        id = None
        if self.key:
            id = self.key.id()
        meta = {
            'id': id,
            'name': self.name,
            'hint': self.hint,
            'width': self.width,
            'author': str(self.author),
            'created': str(created),
            'updated': str(updated),
        }
        meta.update(json.loads(self.data))
        if reduced:
            # Get set of all used colors
            used = set()
            for row in meta['pixels']:
                used.update(row)
            for key in set(meta['colors']).difference(used):
                del meta['colors'][key]
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
                'G': '#00FF00',
                'B': 'blue',
                'P': 'purple',
                'Y': 'yellow',
                'C': '#00FFFF',
                'O': '#FF6600',
                'W': 'white',
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

