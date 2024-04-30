from model_bakery import baker


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


def generate_instance(cls, instance_list):
    for instance in instance_list:
        baker.make(cls, **flat_dict(instance))
