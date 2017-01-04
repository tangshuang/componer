# componer cli

componer的命令行用来直接触发gulp相关命令，并且借用本地安装的gulp和bower，不需要全局安装gulp和bower就可以让用户运行componer命令时实现相应的功能。

比如`componer ls`，虽然它其实是`gulp ls`的翻版，但是它可以非常友好的让用户知道自己现在在做什么事。

而且通过componer，可以优化参数的传入方式，比如：`componer add test -t bower`，不再像之前使用gulp时，必须得用`gulp add --name=test --template=bower`。

另外，componer命令还提供一些无需借助gulp就能实现的方法，比如remove, install, link等。

Componer cli不怎么传参数，除了必要的地方要传以外，其他地方都是通过componout的componer.json来配置。