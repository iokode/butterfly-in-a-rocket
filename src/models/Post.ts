export class Post {
    public title: string;
    public slug: string;
    public author: Author;
    public markdownResume: string;
    public markdownContent: string;

    constructor(title: string, slug: string, author: Author, markdownResume: string, markdownContent: string) {
        this.title = title;
        this.slug = slug;
        this.author = author;
        this.markdownContent = markdownContent;
        this.markdownResume = markdownResume;
    }
}

export class PostResume {
    public title: string;
    public slug: string;
    public publishDate: Date;
    public author: Author;

    constructor(title: string, slug: string, publishDate: Date, author: Author) {
        this.title = title;
        this.slug = slug;
        this.author = author;
        this.publishDate = publishDate;
    }
}

export class Author {
    public name: string;
    public username: string;

    constructor(name: string, username: string) {
        this.name = name;
        this.username = username;
    }
}