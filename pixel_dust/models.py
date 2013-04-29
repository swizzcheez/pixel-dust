"""
models.py

App Engine datastore models

"""


from google.appengine.ext import ndb
import json, random

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

    @classmethod
    def generate(cls, id, size=8):
        if id == 'RANDOM':
            id = '%.6X' % int(random.random() * (1 << 24))
        r = random.Random(id)
        puzzle = cls(group='AUTO',
                     name=id,
                     width=size)
        data = {}
        data['colors'] = {
            ' ': 'black',
            'R': 'red',
            'G': '#00FF00',
            'B': 'blue',
            'P': 'purple',
            'Y': 'yellow',
            'C': '#00FFFF',
            'O': '#FF6600',
            'W': 'white',
        }
        buf = []
        ck = data['colors'].keys()
        c = random.choice(ck)
        for row in range(size):
            buf.append([c]*size)
        for n in range(int(r.random() * 5) + 3):
            x0 = int(r.random() * size * 2) - size / 2
            y0 = int(r.random() * size * 2) - size / 2
            w = int(r.random() * size) + 1
            h = int(r.random() * size) + 1
            c = random.choice(ck)
            for y in range(y0, y0 + h):
                for x in range(x0, x0 + h):
                    if (x >= 0 and y >= 0 and x < size and y < size):
                        buf[y][x] = c
        data['pixels'] = [
            ''.join(row) for row in buf
        ]
        puzzle.data = json.dumps(data)
        return puzzle

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

class Score(ndb.Model):
    group = ndb.StringProperty(required=True)
    name = ndb.StringProperty(required=True)
    player = ndb.UserProperty(required=True)
    score = ndb.IntegerProperty(required=True)
    created = ndb.DateTimeProperty(auto_now_add=True)

    def to_meta(self, reduced=False):
        created = self.created
        id = None
        if self.key:
            id = self.key.id()
        meta = {
            'id': id,
            'group': self.group,
            'name': self.name,
            'score': self.hint,
            'player': str(self.author),
            'created': str(created),
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
