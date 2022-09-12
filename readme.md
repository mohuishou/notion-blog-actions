# notion blog action

将 notion database 中的文章转换为 markdown 文件，提供给 hexo、hugo 等静态博客使用

- 使用 notion 导出接口，支持图片、表格、callout 等格式
- 支持迁移图片到置顶文件夹

## 说明

database template: https://mohuishou.notion.site/3999b0ae72364a4b99a87f7d9d0a52be?v=1df90fd8110541679dc48866b80031ee

### notion

通过 notion 导出 markdown 文件 api 下载 md 文件

### migrate

使用 notion-to-md 导出 markdown 文件，并且支持了 `callout`，以及 front matter
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

    - uses: mohuishou/notion-blog-actions@main
      with:
        notion_secret: ${{ secrets.NOTION_TOKEN }}
        database_id: "xxx"
        output: "./source/_posts/notion/"
        access_key_id: "${{ secrets.ALI_ID }}"
        access_key_secret: "${{ secrets.ALI_SECRET }}"
        bucket: "xxx"
        area: "${{ inputs.oss_endpoint }}"
        prefix: "image/"

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