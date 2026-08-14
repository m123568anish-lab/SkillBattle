class PresenceManager:

    def __init__(self):

        self.online_users = set()

    def online(

        self,

        user_id: str,

    ):

        self.online_users.add(user_id)

    def offline(

        self,

        user_id: str,

    ):

        self.online_users.discard(user_id)

    def is_online(

        self,

        user_id: str,

    ):

        return user_id in self.online_users

    def total(self):

        return len(self.online_users)


presence_manager = PresenceManager()