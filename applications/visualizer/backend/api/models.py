from django.db.models import (
    CASCADE,
    BooleanField,
    FloatField,
    ForeignKey,
    JSONField,
    Model,
    CharField,
    PositiveIntegerField,
    PositiveSmallIntegerField,
    TextField,
    UniqueConstraint,
)


# CREATE TABLE datasets (
#   id VARCHAR(20) NOT NULL,
#   collection VARCHAR(20) NOT NULL,
#   name VARCHAR(50) NOT NULL,
#   description TEXT NOT NULL,
#   time SMALLINT NOT NULL,
#   visual_time SMALLINT NOT NULL,
#   CONSTRAINT pk_datasets PRIMARY KEY (id),
#   INDEX idx_datasets_id (id),
#   INDEX idx_datasets_collection (collection)
# );
class Dataset(Model):
    id = CharField(max_length=20, primary_key=True, db_index=True)
    collection = CharField(max_length=20, db_index=True)
    type = CharField(
        max_length=50,
    )
    name = CharField(
        max_length=50,
    )
    description = TextField()
    time = FloatField()
    visual_time = FloatField()
    axes = JSONField(null=True)


# CREATE TABLE neurons (
#   name VARCHAR(30) NOT NULL,
#   class VARCHAR(30) NOT NULL,
#   neurotransmitter VARCHAR(10) NOT NULL,
#   type VARCHAR(10) NOT NULL,
#   embryonic BOOLEAN NOT NULL,
#   inhead BOOLEAN NOT NULL,
#   intail BOOLEAN NOT NULL,
#   CONSTRAINT pk_neurons PRIMARY KEY (name)
# );
class Neuron(Model):
    name = CharField(max_length=30, primary_key=True)
    nclass = CharField(max_length=30)
    neurotransmitter = CharField(max_length=10)
    type = CharField(max_length=10)
    embryonic = BooleanField(default=False)
    inhead = BooleanField(default=False)
    intail = BooleanField(default=False)


# DROP TABLE IF EXISTS annotations;
# CREATE TABLE annotations (
#   pre VARCHAR(30) NOT NULL,
#   post VARCHAR(30) NOT NULL,
#   type VARCHAR(20) NOT NULL,
#   collection VARCHAR(20) NOT NULL,
#   annotation VARCHAR(30) NOT NULL,
#   CONSTRAINT pk_annotations PRIMARY KEY (pre, post, type, collection, annotation),
#   INDEX idx_annotations_pre (pre),
#   INDEX idx_annotations_post (post),
#   INDEX idx_annotations_type (type),
#   INDEX idx_annotations_collection (collection),
#   INDEX idx_annotations_annotation (annotation)
# );
class Annotation(Model):
    pre = CharField(max_length=30, db_index=True)
    post = CharField(max_length=30, db_index=True)
    type = CharField(max_length=20, db_index=True)
    collection = CharField(max_length=20, db_index=True)
    annotation = CharField(max_length=30, db_index=True)

    class Meta:
        constraints = [
            UniqueConstraint(
                fields=["pre", "post", "type", "collection", "annotation"],
                name="pk_annotations",
            )
        ]


# CREATE TABLE connections (
#   id INT UNSIGNED NOT NULL,
#   dataset_id VARCHAR(20) NOT NULL,
#   pre VARCHAR(30) NOT NULL,
#   post VARCHAR(30) NOT NULL,
#   type VARCHAR(20) NOT NULL,
#   synapses SMALLINT UNSIGNED NOT NULL,
#   CONSTRAINT pk_connections PRIMARY KEY (dataset_id, pre, post, type),
#   CONSTRAINT idx_connections_dataset_id FOREIGN KEY (dataset_id) REFERENCES datasets(id),
#   INDEX idx_connections_id (id),
#   INDEX idx_connections_dataset_id (dataset_id),
#   INDEX idx_connections_pre (pre),
#   INDEX idx_connections_post (post),
#   INDEX idx_connections_type (type),
#   INDEX idx_connections_synapses (synapses)
# );
class Connection(Model):
    id = PositiveIntegerField(primary_key=True, db_index=True)
    dataset = ForeignKey(
        to=Dataset, on_delete=CASCADE, db_index=True, related_name="connections"
    )
    pre = CharField(max_length=30, db_index=True)
    post = CharField(max_length=30, db_index=True)
    type = CharField(max_length=20, db_index=True)
    synapses = PositiveSmallIntegerField(db_index=True)

    class Meta:
        constraints = [
            UniqueConstraint(
                fields=["dataset", "pre", "post", "type"], name="pk_connections"
            )
        ]


# CREATE TABLE synapses (
#   id INT UNSIGNED NOT NULL AUTO_INCREMENT,
#   connection_id INT UNSIGNED NOT NULL,
#   connector_id INT UNSIGNED NOT NULL,
#   weight INT UNSIGNED NOT NULL,
#   pre_tid INT UNSIGNED NOT NULL,
#   post_tid INT UNSIGNED NOT NULL,
#   CONSTRAINT pk_synapses PRIMARY KEY (id),
#   CONSTRAINT idx_synapses_connection_id FOREIGN KEY (connection_id) REFERENCES connections(id),
#   INDEX idx_synapses_connection_id (connection_id),
#   INDEX idx_synapses_connector_id (connector_id),
#   INDEX idx_synapses_weight (weight),
#   INDEX idx_synapses_pre_tid (pre_tid),
#   INDEX idx_synapses_post_tid (post_tid)
# );
class Synapse(Model):
    connection = ForeignKey(to=Connection, on_delete=CASCADE, db_index=True)
    connector_id = PositiveIntegerField(db_index=True)
    weight = PositiveIntegerField(db_index=True)
    pre_tid = PositiveIntegerField(db_index=True)
    post_tid = PositiveIntegerField(db_index=True)

    class Meta:
        constraints = [
            UniqueConstraint(
                fields=["connection", "connector_id", "weight", "pre_tid", "post_tid"],
                name="unique_synapse",
            )
        ]


class ViewerConfig(Model):
    dataset = ForeignKey(
        to=Dataset, on_delete=CASCADE, db_index=True, related_name="config"
    )
    em_config = JSONField(null=True)
    segmentation_config = JSONField(null=True)
