# Resources with nested structure

Say you have a foreignkey author, and an array of foreign keys to contributors.

First we need to model what this will look like by adding members to our [Resource][1] defintion.
These should be the primary keys of the entities we care about.

Next we'll need to extend the schema definition provided by `getEntitySchema()`.

```tsx
import { Resource } from 'rest-hooks';
import { UserResource } from 'resources';

export default class ArticleResource extends Resource {
  readonly id: number | null = null;
  readonly content: string = '';
  readonly author: number | null = null;
  readonly contributors: number[] = [];

  pk() {
    return this.id;
  }
  static urlRoot = 'http://test.com/article/';

  // operative method!
  static getEntitySchema<T extends typeof Resource>(this: T) {
    const schema = super.getEntitySchema();
    schema.define({
      author: UserResource.getEntitySchema(),
      contributors: [UserResource.getEntitySchema()]
    })
    return schema;
  }
}
```

[1]: ../api/Resource.md
