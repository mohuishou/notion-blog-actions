# notion blog action

将 notion database 中的文章转换为 markdown 文件，提供给 hexo、hugo 等静态博客使用

- 使用 notion 导出接口，支持图片、表格、callout 等格式
- 支持迁移图片到置顶文件夹

## 使用说明

### Notion

- 使用 [database 模板](https://mohuishou.notion.site/3999b0ae72364a4b99a87f7d9d0a52be?v=1df90fd8110541679dc48866b80031ee) 创建一个数据库
  ![](docs/database_tpl.jpg)
- 参考 [Notion 官方教程](https://developers.notion.com/docs/getting-started#step-1-create-an-integration) 创建一个应用，并获取到 token
  ![](./docs/app-sec.jpg)
- 将之前创建好的页面分享给刚刚创建的应用，[教程](https://developers.notion.com/docs/getting-started#step-2-share-a-database-with-your-integration)

### Github Action

#### 参数说明

```yaml
inputs:
  token:  # id of input
    description: notion app token，建议最好放到 Action Secret 中
    required: true
  database_id:
    required: true
    description: |
      notion 中的数据库 id
      - 假设你的数据库页面链接是 `https://www.notion.so/you-name/0f3d856498ca4db3b457c5b4eeaxxxxx`
      - 那么 `database_id=0f3d856498ca4db3b457c5b4eeaxxxxx`
  status_name:
    description: notion database 状态字段的字段名，支持自定义
    default: "status"
  status_published:
    description: notion database 文章已发布状态的字段值
    default: "已发布"
  status_unpublish:
    description: |
      notion database 文章待发布状态的字段值
      触发 action 后会自动拉去所有该状态的文章，成功导出之后会把这篇文章的状态修改为上面设置的已发布状态
    default: "待发布"
  migrate_image:
    description: |
      是否迁移图片到 aliyun oss
      注意: 如果不迁移图片默认导出图片链接是 notion 的自带链接，有访问时效
      目前支持迁移图片到 aliyun oss 中
    default: "true"
  output:
    required: false
    description: 输出的文件夹路径
  access_key_id:
    description: aliyun access_key_id
    required: true
  access_key_secret:
    description: aliyun access_key_secret
    required: true
  bucket:
    description: aliyun bucket
    required: true
  area:
    description: "aliyun area: oss-cn-hangzhou"
    required: true
    default: oss-cn-hangzhou
  prefix:
    description: "file dir, e.g. image/"
```
  
  #### 配置示例

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