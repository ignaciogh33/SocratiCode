classDiagram
    class AbstractUser {
        <<abstract>>
        - id: Int               [PK]
        - username: String      [UQ, NN]
        - password: String      [NN]
        - first_name: String
        - last_name: String
        - is_staff: Boolean
        - is_active: Boolean
        - date_joined: DateTime
        - last_login: DateTime
    }

    AbstractUser <|-- User

    class User {
        - email: String         [UQ, NN]
        - bio: String
        - theme: String
    }

    class ChatSession {
        - id: Int               [PK]
        - user_id: Int          [FK]
        - title: String
        - created_at: DateTime
        - updated_at: DateTime
    }

    class Message {
        - id: Int               [PK]
        - session_id: Int       [FK]
        - role: String
        - content: String
        - moderated: Boolean
        - created_at: DateTime
    }

    class SystemConfig {
        - id: Int               [PK]
        - moderation_mode: String
        - llm_model: String
        - moderation_model: String
        - mod_word_window: Int
        + save() : void
        + get() : SystemConfig$
    }

    User "1" *-- "*" ChatSession : posee
    ChatSession "1" *-- "*" Message : contiene