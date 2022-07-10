from tortoise import fields, models


class Player(models.Model):
    """
    Player model
    """

    session_id = fields.CharField(max_length=20, null=False, required=True)
    username = fields.CharField(max_length=20, null=False, required=True)
    player_id = fields.CharField(max_length=20, null=False, pk=True, required=True)
    connection_state = fields.CharField(max_length=20, null=False, required=True)



#     state = fields.CharField(max_length=10, null=False, required=True)
#     players = fields.ForeignKeyField("models.Player")
