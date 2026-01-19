# ERD (Entity Relationship Diagram)

```mermaid
erDiagram
  USER {
    ObjectId _id
    string username
    string email
    string role
    string status
    number coins
    string avatarUrl
    object bankAccount
    object readerSettings
    ObjectId[] unlockedChapters
    datetime createdAt
    datetime updatedAt
  }

  NOVEL {
    ObjectId _id
    string title
    string author
    ObjectId authorUser
    ObjectId poster
    string type
    string status
    string coverImageUrl
    number views
    number commentsCount
    number averageRating
    number nominationCount
    boolean isDeleted
    datetime createdAt
    datetime updatedAt
  }

  CHAPTER {
    ObjectId _id
    ObjectId novel
    number chapterNumber
    string title
    string content
    object rawFile
    object htmlFile
    boolean isLocked
    number priceXu
    datetime createdAt
    datetime updatedAt
  }

  COMMENT {
    ObjectId _id
    ObjectId novel
    ObjectId chapter
    ObjectId user
    ObjectId parentComment
    ObjectId[] likes
    string content
    boolean isDeleted
    datetime createdAt
    datetime updatedAt
  }

  REVIEW {
    ObjectId _id
    ObjectId novel
    ObjectId user
    ObjectId parentReview
    ObjectId[] likes
    number rating
    string content
    boolean isDeleted
    datetime createdAt
    datetime updatedAt
  }

  BOOKMARK {
    ObjectId _id
    ObjectId user
    ObjectId novel
    datetime createdAt
    datetime updatedAt
  }

  READING_PROGRESS {
    ObjectId _id
    ObjectId user
    ObjectId novel
    ObjectId[] readChapters
    number totalChaptersRead
    number completionPercentage
    datetime lastReadAt
    boolean notifyOnNewChapter
    datetime createdAt
    datetime updatedAt
  }

  NOTIFICATION {
    ObjectId _id
    ObjectId user
    ObjectId relatedNovel
    ObjectId relatedChapter
    string type
    boolean isRead
    string title
    string message
    datetime createdAt
    datetime updatedAt
  }

  REPORT {
    ObjectId _id
    ObjectId reporter
    ObjectId assignedTo
    string targetType
    ObjectId targetId
    string reason
    string status
    string priority
    datetime createdAt
    datetime updatedAt
  }

  TRANSACTION {
    ObjectId _id
    ObjectId user
    ObjectId novel
    ObjectId chapter
    string type
    string direction
    number amount
    number amountVnd
    string provider
    string status
    datetime createdAt
    datetime updatedAt
  }

  NOMINATION_LOG {
    ObjectId _id
    ObjectId user
    string dateKey
    number used
    datetime createdAt
    datetime updatedAt
  }

  GENRE {
    ObjectId _id
    string name
    string slug
    string description
    boolean isActive
    number displayOrder
    ObjectId createdBy
    datetime createdAt
    datetime updatedAt
  }

  USER ||--o{ NOVEL : poster
  USER ||--o{ NOVEL : authorUser
  NOVEL ||--o{ CHAPTER : has
  NOVEL ||--o{ COMMENT : has
  CHAPTER ||--o{ COMMENT : has
  USER ||--o{ COMMENT : writes
  COMMENT ||--o{ COMMENT : replies

  NOVEL ||--o{ REVIEW : has
  USER ||--o{ REVIEW : writes
  REVIEW ||--o{ REVIEW : replies

  USER ||--o{ BOOKMARK : saves
  NOVEL ||--o{ BOOKMARK : bookmarked

  USER ||--o{ READING_PROGRESS : tracks
  NOVEL ||--o{ READING_PROGRESS : tracked
  CHAPTER }o--o{ READING_PROGRESS : readChapters

  USER ||--o{ NOTIFICATION : receives
  NOVEL ||--o{ NOTIFICATION : relatedNovel
  CHAPTER ||--o{ NOTIFICATION : relatedChapter

  USER ||--o{ REPORT : reports
  USER ||--o{ REPORT : assigned

  USER ||--o{ TRANSACTION : makes
  NOVEL ||--o{ TRANSACTION : purchase
  CHAPTER ||--o{ TRANSACTION : purchase

  USER ||--o{ NOMINATION_LOG : daily
  USER ||--o{ GENRE : creates
```

Ghi chú:
- `Novel.genres` lưu mảng chuỗi nên không ràng buộc trực tiếp với `Genre`.
- `Report.targetId` là quan hệ đa hình theo `targetType`.
- Một số trường (file metadata, settings) là đối tượng nhúng nên không tách thành thực thể riêng.
