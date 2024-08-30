All files have a set of errors. Here is an overview of the errors:

```python
{
    "neurons": [
        {
            "inhead": 0,
            "name": 123,  # invalid name
            "emb": 1,
            "nt": "l",
            "intail": 0,
            "classes": "ADA",
            "typ": "i",
        },
        {
            "inhead": 2,  # not valid bool interpretation
            "name": "ADAL",
            "emb": 1,
            "nt": "l",
            "intail": 0,
            "classes": "ADA",
            "typ": "i",
        },
        {
            "inhead": 0,
            "name": "ADAL",
            "emb": -1,  # not valid bool interpretation
            "nt": "l",
            "intail": 0,
            "classes": "ADA",
            "typ": "i",
        },
        {
            "inhead": 0,
            "name": "ADAL",
            "emb": 1,
            "nt": "l",
            "intail": 1.2,  # not valid bool interpretation
            "classes": "ADA",
            "typ": "i",
        },
    ],
    "datasets": [
        {
            "id": "white_1986_jse",
            "name": "White et al., 1986, JSE (adult)",
            "type": "taill",  # invalid dataset type
            "time": 60,
            "visualTime": 50,
            "description": "Adult legacy tail with pre-anal ganglion",
        }
    ],
    "connections": {
        "white_1986_jse": [
            {
                "ids": [9583833],
                "post": "ADAR",
                "post_tid": [9576727],
                "pre": "ADAL",
                "pre_tid": [9577831],
                "syn": [1],
                "typ": 1,  # invalid connection type
            },
            {
                "ids": [9583833, 9583834],
                "post": "ADAR",
                "post_tid": [9576727],
                "pre": "ADAL",
                "pre_tid": [9577831],  # should be the same length as ids
                "syn": [1],
                "typ": 2,
            },
            {
                "ids": [9583833],
                "post": "ADAR",
                "post_tid": [
                    9576727,
                    9583834,
                    9583834,
                ],  # should be the same length as ids
                "pre": "ADAL",
                "pre_tid": [9577831],
                "syn": [1],
                "typ": 2,
            },
            {
                "ids": [9583833],
                "post": "ADAR",
                "post_tid": [9576727],
                "pre": "ADAL",
                "pre_tid": [9577831],
                "syn": [1, 1],  # should be the same length as ids
                "typ": 2,
            },
        ]
    },
    "annotations": {
        "head": {
            "inexistent": [["ADAL", "RIPL"]]
        },  # inexistent is not an annotation type
        "complete": {
            "increase": [
                ["ADAL", "RIPL", "CEPDL"],  # not a tuple of only pre and post
                ["ADAR", "RIPR"],
            ]
        },
        "taill": {  # taill is not valid annotation entry
            "increase": [
                ["ADAL", "RIPL"],
                ["ADAR", "RIPR"],
                ["ADEL", "AVKR"],
            ]
        },
    },
}
```