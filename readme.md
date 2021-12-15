# notion blog action

将 notion database 中的文章转换为 markdown 文件，提供给 hexo、hugo 等静态博客使用

- 使用 notion 导出接口，支持图片、表格、callout 等格式
- 支持迁移图片到置顶文件夹

## 说明

database template: TBD

### notion

通过 notion 导出 markdown 文件 api 下载 md 文件

### migrate

迁移导出 md 文件中的图片资源到指定文件夹，支持属性字段含有图片的情况

## 使用示例

```yaml
on: [repository_dispatch, watch]

name: notion

jobs:
  notion:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master
      with:
        submodules: false

    - uses: mohuishou/notion-blog-actions/notion@v1
      with:
        token: ${{ secrets.NOTION_TOKEN }}
        token_v2: ${{ secrets.NOTION_TOKEN_V2 }}
        space_id: "30f7441ad3314261a02ca4078e4a61f0"
        database_id: "0fc0dba2f7924c19ac8283372ac784dc"
        output: "./tmp/"

    - name: "migrate image"
      uses: mohuishou/notion-blog-actions/migrate@v1
      with:
        input: "./tmp/*.md"

    - name: "cp md files"
      run: |
        cp -f tmp/*.md source/_posts/notion/
        rm -rf tmp

    - name: git setting
      run: |
        git config --global user.email "1@lailin.xyz"
        git config --global user.name "mohuishou"
      
    - name: update blog
      run: |
        git add source
        git commit -m "feat: auto update by notion sync"
        git push
```