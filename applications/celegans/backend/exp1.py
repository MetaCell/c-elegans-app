d = {
    "a": "b",
    "c": {"name": "azerty", "age": 15, "child": {"other": "stuff", "stub": False}},
}


def flat_dict(d):
    res = {}
    for key, value in d.items():
        if isinstance(value, dict):
            subdict = flat_dict(value)
            for subk, subv in subdict.items():
                res[f"{key}__{subk}"] = subv
        else:
            res[key] = value
    return res


from pprint import pprint as print

print(flat_dict(d))
