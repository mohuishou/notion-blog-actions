# notion blog action

将 notion database 中的文章转换为 markdown 文件，提供给 hexo、hugo 等静态博客使用

- 使用 notion 导出接口，支持图片、表格、callout 等格式
- 支持迁移图片到置顶文件夹

## 说明

database template: https://mohuishou.notion.site/3999b0ae72364a4b99a87f7d9d0a52be?v=1df90fd8110541679dc48866b80031ee

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

    - uses: mohuishou/notion-blog-actions/notion@main
      with:
        token: ${{ secrets.NOTION_TOKEN }}
        token_v2: ${{ secrets.NOTION_TOKEN_V2 }}
        space_id: "输入你的空间 id"
        database_id: "输入你的 database id"
        output: "./tmp/"

    - name: "migrate image"
      uses: mohuishou/notion-blog-actions/migrate@main
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