菜鸟云打印标记语言规范(CNPL)

更新日期：2025-05-27访问次数：58037

# **简介**

菜鸟打印标记语言(CAINIAO PRINT LANGUAGE)是菜鸟官方定义的一套用于描述打印内容的的标准，其定义了一套标准规范，由自定义的XML标签描述样式信息，同时支持嵌入JS代码片段以支持按照给定的数据动态生成XML标签。  
菜鸟打印标记语言在二维坐标系中通过描述不同元素的坐标及尺寸来表示图像的内容，坐标系以左上角为起点（0，0），在菜鸟打印标记语言中坐标通过left、top来表示，并总是使用相对坐标（子元素坐标相对于父元素坐标进行偏移）

# **静态内容规范**

## **标签概览**

打印标记语言所包含的标签如下：

|   |   |
|---|---|
|**标签**|**说明**|
|page|模版的根节点，代表打印纸张|
|header|页头，仅能用于page下，最多包含一个header|
|footer|页脚，仅能用于page下，最多包含一个footer|
|layout|容器元素，表示一个容器，在容器中可放置其他元素|
|text|子节点，表示文本|
|line|子节点，表示线条|
|rect|子节点，表示矩形|
|barcode|条码或二维码|
|image|图片标记元素|
|circle|圆形|
|table|表格|
|tr|表格行，仅可以包含在Table的下级节点|
|td|表格中的单元格，仅可以包含在tr中|
|th|表格头（单元格），仅可以包含在tr中，在一个table中仅有一个tr可以包含th|
|round|圆角矩形|
|pageIndex|页码，仅能用于header或footer节点下|

## **page(页)**

页面属性，用于描述打印纸张的信息,是整个xml的根节点。

### **属性**

可用属性如下

|   |   |
|---|---|
|属性|描述|
|width|页面宽度，默认单位为毫米|
|height|页面高度，默认单位为毫米|
|splitable|允许拆分|

## **header（页头）**

### **属性**

可用属性如下

|   |   |
|---|---|
|属性|描述|
|height|页头高度，默认单位为毫米|

样例如下

```
<header height="10">
  <!--其他元素-->
</header>
```

- header总是从页面的原点向下占据height

- 如果页面允许拆分，则header会出现在所有拆分出的页面中

## **footer（页脚）**

### **属性**

可用属性如下

|   |   |
|---|---|
|属性|描述|
|height|页头高度，默认单位为毫米|

样例如下

```
<header height="10">
  <!--其他元素-->
</header>
```

- foooter总是从页面的底部向上占据height的空间

- 如果页面允许拆分，则foooter会出现在所有拆分出的页面中

## **pageIndex（页码）**

### **属性**

可用属性如下

|   |   |
|---|---|
|属性|描述|
|format|格式化文本<br><br>可以使用totalPageNumber和currentPageNumber占位，在展示时会被替换成当前页码|

样例如下

```
<pageIndex format="第currentPageNumber/totalPageNumber页"/>
```

- pageIndex只允许用于header或footer节点中

## **layout(布局)**

### **属性**

可用属性如下

|   |   |
|---|---|
|属性|描述|
|left|元素左上角横坐标，默认单位毫米|
|top|元素左上角纵坐标，默认单位毫米|
|width|元素宽度，默认单位毫米|
|height|元素高度，默认单位毫米|
|orientation|浮动元素的布局方式，可用horizontal（水平布局）或vertical（垂直布局）|
|id|元素唯一标识符|
|ref|引用标识符，可以设置为其他layout的id|
|style|元素样式|

样例如下

```
<layout left="1.8" top="2.2" width="8.3" height="2.5">
  <!--其他元素-->
</layout>
```

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328418331_C8Q5stzO)

- orientation属性

仅对下一级子元素生效，当子元素没有设置left或top时，我们将此类元素称为**浮动元素**，否则称为**固定元素**，浮动元素的位置由所有子元素的宽高及子元素的顺序决定，浮动元素在布局时会尽量避免元素间的重叠，如果一级子元素中同时包含固定元素和浮动元素，则优先排除固定元素占据的空间位置，然后在剩下的空间中排列浮动元素。

支持水平（horizontal）和垂直（vertical）二种布局模式，默认为水平布局。  
a. 水平布局如下图(如orientation=“horizontal”)：  
![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328418580_ySDrFTyr)

水平布局中的元素，都以水平模式排列。

b. 垂直布局如下图(如orientation=“vertical”)：  
![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328418756_7AWnJ0P5)

垂直布局中的元素，都以垂直模式排列。

- ref 属性

ref可以引用其他元素，可以将其他元素完整的复制到当前节点

样例如下

```
<layout id="abc" left="1.8" top="2.2" width="8.3" height="2.5">
  <!--其他子元素-->
</layout>
<!--其他兄弟元素-->
<!--表示将id为abc的元素及其子元素全部复制到当前区域（不包括width、height、left、top属性）-->
<layout ref="abc" left="3" top="10" width="10" height="20"/>
```

引用的布局的主键ID，IDREF类型，把被引用的布局属性全部复制过来，当前布局可以重新设置属性去覆盖引用过来的布局属性。如ref=“1”。

### **样式表**

layout可用的style属性如下，详细的style信息见todo style链接

|   |   |
|---|---|
|**属性名**|**说明**|
|zIndex|排序|
|overflow|超出处理|
|backgroundColor|背景色|
|borderWidth|边框宽度|
|borderStyle|边框样式|
|margin|元素外边距|
|padding|元素内边距|

style样例如下

```
style="zIndex:1;overflow:hiden;"
```

## **text(文本)**

### **属性**

可用属性如下

|   |   |
|---|---|
|属性|描述|
|left|元素左上角横坐标，默认单位毫米|
|top|元素左上角纵坐标，默认单位毫米|
|width|元素宽度，默认单位毫米|
|height|元素高度，默认单位毫米|
|value|文本值|
|style|样式表|

画布的基础元素，文本自身无边框，只有里面的文本内容。  
如果只是简短文本并且文本中没有特殊字符可以如下方式使用：

```
<text width="5.6" height="10" value="菜鸟网络" style="fontSize:16"/>
```

如果文本比较长或者有换行需求，可以使用

```
<text width="5.6" style="fontSize:16">
line 1 
line 2 
</text>
```

注意：每一行文本前后的空白字符都会被保留。

如果文本中有特殊字符，如“，&，‘，<,>等等xml规范中的特殊字符，可以如下方式使用,这种方式文本中的特殊字符不会被转义：

```
<text width="5.6" style="fontSize:16">
<![CDATA[some text, &,",',<,> ... 菜鸟网络]]>
</text>
```

备注：如果text内容中要输出“<%”或“%>”，需要添加"\"做转义，也即”<\%“或”%\>" 。

### **样式表**

可用的样式表如下

text可用的style属性如下， 详细含义请查看([style样式](https://support-cnkuaidi.taobao.com/doc.htm#chapter11))

|   |   |
|---|---|
|**属性名**|**说明**|
|alpha|透明度|
|align|水平对齐|
|valign|垂直对齐|
|rotation|旋转角度|
|direction|文字书写方向|
|orientation|文本排版方向|
|fontColor|字体颜色|
|backgroundColor|背景色|
|fontFamily|字体族|
|fontSize|字体大小，如fontSize:8。可以取值为“auto”,此时会根据文本框大小进行字体缩放|
|fontWeight|字体粗细|
|fontItatlic|字体是否斜体|
|fontUnderline|字体是否有下划线|
|lineHeight|行高|
|wrap|是否自动换行|

## **line(线条)**

### **属性**

可用属性如下

|   |   |
|---|---|
|属性|描述|
|startX|线条起点的横坐标|
|startY|线条起点的纵坐标|
|endX|线条终点的横坐标|
|endY|线条终点的纵坐标|
|style|样式表|

画布的基本元素，线条用来画从一个起点到一个终点之间的连线。  
示例：

```
<line startX="3.2" startY="5.5" endX="10.2" endY="6.5"  style="lineType:solid" />
```

效果如下图(蓝色为所画线条)：

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328418940_lMPSM4WI)

### **样式表**

可用的样式表如下

详见([style样式](https://support-cnkuaidi.taobao.com/doc.htm#chapter11))

|   |   |
|---|---|
|**属性名**|**说明**|
|lineColor|线条颜色|
|lineWidth|线条宽度|
|lineType|线条的样式|

## **rect(矩形)**

### **属性**

可用属性如下

|   |   |
|---|---|
|属性|描述|
|width|矩形宽度|
|height|矩形高度|
|style|样式表|

画布的基础元素，用来描绘一块区域。如

```
<layout left="1.8" top="2.2" width="8.3" height="2.5">
    <rect width="3.3" height="1.5" style="borderStyle:solid"/>  
</layout>
```

效果图如下：

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328419135_FcGdqLmM)

### **样式表**

可用样式如下

|   |   |
|---|---|
|**属性名**|**说明**|
|rotation|旋转角度|
|fillColor|填充色|
|borderWidth|边框宽度|
|borderStyle|边框样式|

## **barcode(条码与二维码)**

### **属性**

可用属性如下

|   |   |
|---|---|
|属性|描述|
|width|矩形宽度|
|height|矩形高度|
|type|条码/二维码类型|
|ratioMode|keepRatio-保持比例 ignoreRatio-忽略比例，即条码会填充所在区域|
|mode|aztec和pdf417的ecc level|
|primary|maxicode的primary|
|errorCorrection|qrcode的纠错级别<br><br>0、1、2、3表示L、M、Q、H|
|symbolSize|datamatrix和aztec的符号尺寸|
|style|样式表|

画布的基础控件，条形码根据数据生成的图片。  
示例：

```
<barcode width="2.5" height="7.0" value="123987af" type="code128a" style="hideText:true"/>
```

如果barcode中有特殊字符，如“，&，‘，<,>等等xml规范中的特殊字符，可以如下方式使用,这种方式文本中的特殊字符不会被转义：

```
<barcode width="2.5" height="7.0" type="code128a" style="hideText:true">
<![CDATA[123987af<>!&*$#]]>
</barcode>
```

备注：如果要输出“<%”或“%>”，需要添加“"做转义，也即”<\%“或”%>" 。

效果图如下：

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328419306_gNimScBI)

可用的type如下

code128、code128b、ean128、qrcode、code11、postnet、pdf417、code39、code93、upca、upce、ean8、ean13、itf14、c25inter、maxicode、datamatrix、aztec、hibcAztec、rm4scc、gs1Datamatrix、gs128Linear、codabar

### **样式表**

可用样式如下

参考([style样式](https://support-cnkuaidi.taobao.com/doc.htm#chapter11))

|   |   |
|---|---|
|**属性名**|**说明**|
|rotation|旋转角度|
|hideText|是否显示文本|

## **image(图片)**

### **属性**

|   |   |
|---|---|
|属性|描述|
|width|矩形宽度|
|height|矩形高度|
|src|图像的链接|
|allowFailure|是否允许失败，若不允许失败，则在失败时会中断打印|
|style|样式表|

画面的基础控件，插入静态图片资源。  
示例：(真实的图片)

```
<image width="5.5" height="4.5" src="http://www.taobao.com/test.jpg" allowFailure="false"/>
```

### **样式表**

|   |   |
|---|---|
|**属性名**|**说明**|
|alpha|透明度|
|rotation|旋转角度|

## **table(表格)**

表格不允许设置高度，表格的高度由表格中的行的高度决定

表格的使用需要遵循下面的规范

- 表格的下级元素只能使用tr标签

- tr标签的下级元素只能使用th或td

- 同一个tr中只允许包含td或th

- 在一个table中最多允许一个tr中包含th，且这个tr需要为table中的第一个tr

- 在td中允许包含layout及其他所有的节点元素，但不允许包含另外一个table

- 在th中只允许使用text标签

### **属性**

|   |   |
|---|---|
|属性|描述|
|left|表格左上角横坐标位置，默认单位毫米|
|top|表格左上角纵坐标位置，默认单位毫米|
|width|表格宽度，默认单位毫米|

表格样例如下

```
<table width="80">  
    <tr>
        <th width="40"> header1 </th>
        <th width="40"> header2 </th>
    </tr>
    <tr>
        <td> field1.1 </td>
        <td> field1.2 </td>
    </tr>
    <tr>
        <td> field2.1 </td>
        <td> field2.2 </td>   
    </tr>
</table>
```

### **样式表**

|   |   |
|---|---|
|**样式名**|**说明**|
|borderWidth|外边框线条宽度|
|borderStyle|外边框样式|
|headerBorderWidth|表头线条宽度|
|headerBorderStyle|表头线条样式|
|cellBorderWidth|单元格线条宽度|
|cellBorderStyle|单元格线条样式|

- 表头和单元格的边框样式支持设置1个或两个值，第一个值表示横线的宽度或样式，第二个值表示竖线的宽度或样式；如果设置一个值，表示横竖样式一致

- headerBorderWidth和headerBorderStyle不设置时，默认采用cellBorderWidth和cellBorderStyle

- cellBorderWidth和cellBorderStyle不设置时，默认线条宽度是1pt，样式是solid（实线）

## **tr（行）**

tr不支持任何属性

tr的高度由tr中的td决定，tr的高度为tr中所有td的高度的最大值（不包括跨行的单元格）

如果没有指定th或th没有指定宽度，则表格中列宽为当前列的所有单元格的最大列宽（不包括跨列的单元格），若th已经指定了宽度，则列宽由表头指定并忽略当前列中所有单元格的宽度

## **th（表头）**

### **属性**

|   |   |
|---|---|
|**属性名**|**说明**|
|width|列宽|
|height|高度|

- th支持width属性，用于指定列宽，该属性为必选项

- width属性支持如下两种类型：

- 百分比：30%， 占整个表格宽度的30%

- 固定值：单位为mm

- table里面可以不包含th，如果table被拆分成多页，则th会在所有被分页的table上显示

### **样式表**

th可用的style属性如下， 详细含义请查看([style样式](https://support-cnkuaidi.taobao.com/doc.htm#chapter11))

|   |   |
|---|---|
|**样式名**|**说明**|
|padding|元素内边距|

## **td（单元格）**

### **属性**

|   |   |
|---|---|
|**属性名**|**说明**|
|width|单元格宽度|
|height|单元格高度|
|rowspan|跨行|
|colspan|跨列|

- colspan：一个单元格可以跨多列 可选

- rowspan：一个单元格可以跨多行 可选

- width：单元格的宽度,可选,单位毫米（mm），不建议设置该属性，因为在对于列的th上已经设置了width。如果设置td的width，则存在如下两种情况：

- td的width小于th指定的列宽，则td的width设置被忽略

- td的width大于th指定的列宽，则列宽用td的width来替代

- height：单元格的高度,可选,单位毫米（mm），默认情况下，不需要指定height属性，单元格的高度根据内容自适应。该行的行高取最大的单元格的高度，如果指定了height属性，则存在如下两种情况：

- td的height小于该行的行高，则td的height设置被忽略

- td的height大于该行的行高，则该行的行高用td的height来替代

### **样式表**

td可用的style属性如下， 详细含义请查看([style样式](https://support-cnkuaidi.taobao.com/doc.htm#chapter11))

|   |   |
|---|---|
|**样式名**|**说明**|
|padding|元素内边距|

### **分页**

- 分页需要配置 page 标签中的splitable配置为 true，table 标签去除 height 属性即可分页,如果保存后又出现height,则把 table 标签的上级 layout 中的 height去除

- 如果指定了表头，则分页时，每页都会带上表头

- 分页是以行为单位，如果行无法在当前页中显示（即使只有0.1mm无法显示），则会将当前行放到下一页显示

## **style(样式)**

样式不是画布的基础元素，用来描述基础元素的展现形式。样式由一组属性组成，每个属性有一个值，属性名称和值通过冒号分开。如property:value。多个样式属性之间使用分号分开，属性之间的空格会被忽略。如style=“alpha:0.6; align:left;”。

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328419491_w5GJCuL0)

元素框的最内部分是实际的内容，直接包围内容的是内边距。

### **边距**

**margin（外边距）**

- a. margin:1 2 3 4，表示上边框外边距1毫米，右边框外边距2毫米，下边框外边距3毫米，左边框外边距4毫米。

- b. margin:1 2 3，表示上边框外边距1毫米，左右边框外边距2毫米，下边框外边距3毫米。

- c. margin:1 2，表示上下边框外边距1毫米，左右边框外边距2毫米。

- d. margin:1 ，表示上下左右边框外边距1毫米。

备注：如果单位是pt则不能省略，单位建议使用毫米（mm）。

**padding（内边距）**

边框距离实际内容的距离。  
- a. padding:1 2 3 4，表示上边框内边距1毫米，右边框内边距2毫米，下边框内边距3毫米，左边框内边距4毫米。

- b. padding:1 2 3，表示上边框内边距1毫米，左右边框内边距2毫米，下边框内边距3毫米。

- c. padding:1 2，表示上下边框内边距1毫米，左右边框内边距2毫米。

- d. padding:1 ，表示上下左右边框内边距1毫米。

备注：如果单位是pt则不能省略，单位建议使用毫米（mm）。

### **对齐方式**

**align(水平对齐)**

枚举值，包括 左对齐（left），居中（center），右对齐（right）

- a. 左对齐的效果如下(align:left)

左图为一个layout中多个基础控件的对齐效果图，右图为一个文本框中的文字对齐效果图。

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328419751_qi1leo82) ![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328419908_spah8915)

- b. 居中对齐的效果如下(align:center)  
    左图为一个layout中多个基础控件的对齐效果图，右图为一个文本框中的文字对齐效果图。  
    ![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328420090_JTyUkSrI) ![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328420269_j2iNpAYk)

- c. 右对齐的效果如下(align:right)：  
    左图为一个layout中多个基础控件的对齐效果图，右图为一个文本框中的文字对齐效果图。

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328420468_1yE6tHfv) ![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328420641_JCzAhmoY)

**valign(垂直对齐)**

- a. 上对齐的效果图如下(valign:top)：  
    左图为一个layout中多个基础控件的对齐效果图，右图为一个文本框中的文字对齐效果图。

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328420850_J5domIJr)

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328420991_N20ZkYDa)

- b. 居中对齐的效果图如下(valign:middle)：  
左图为一个layout中多个基础控件的对齐效果图，右图为一个文本框中的文字对齐效果图。

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328421164_ERFUpX7E) ![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328421350_FjWrlGQu)

```
- c.    下对齐的效果图如下(valign:bottom)：
    左图为一个layout中多个基础控件的对齐效果图，右图为一个文本框中的文字对齐效果图。
```

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328421505_7zlwdANc) ![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328421658_zGaXHDqJ)

### **10.3 字体**

**fontColor(字体颜色)**

字体颜色，字符串类型，颜色由一个十六进制符号来定义，这个符号由红色、绿色、蓝色的值组成(RGB)。每种颜色的最小值是0(十六进制：#00)，最大值255(十六进制：#FF)。格式为#rrggbb。如fontColor:#120FAC。  
默认为黑色 fontColor:#000000。

**fontFamily(字体类型)**

字体类型，字符串型。默认为宋体。省略则用默认宋体。如果选择的字体当前系统不支持，则使用默认的宋体。

- a. 宋体的效果图如下(fontFamily:宋体)：

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328421829_3SFyMFw7)

- b.楷体的效果图如下(fontFamily:华文行楷)：

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328422037_6Fzjt29b)

**fontSize(字体大小)**

字体大小，单位为磅，如fontSize:12pt，如不指定则默认为8pt。

当指定为auto时，text必须指定width和height，否则中打印时会报错syntax error

若指定为auto，则按照以下规则计算实际的字体大小

如果是多行文本，则调整字号使文字内容的宽高恰好小于text指定的宽高

如果是单行文本，则调整字号使文字内容的高度恰好小于text指定的高度

**fontWeight(字体粗细)**

设置文本字体的粗细，枚举型，light、normal、bold，如“fontWeight:bold”。

|   |   |
|---|---|
|**常用取值**|**描述**|
|light|定义较细的字符。|
|normal|默认值，定义标准的字符。|
|bold|定义粗体字符。|

**fontItalic(斜体)**

字体斜体， bool类型(true为斜体，false为正常)。默认为正常。如fontItalic:false。

**fontUnderline(下划线)**

字体下划线，bool类型(true为有下划线，false为无下线划)。默认为无下划线。如fontUnderline:false。

**letterSpacing(字符间距)（已废弃）**

字符串增加或减少字符间的空白，支持百分比和绝对值两种类型，默认单位是绝对值类型中的pt（磅）：

##### 百分比：100%为正常间距，150%为正常间距的1.5倍，如“letterSpacing:150%”。

##### 绝对值：单位为pt(磅)或者mm（毫米），正常值为0，建议使用pt作为单位，如“letterSpacing:3pt”，表示将正常字符间距拉宽3pt。

效果图如下：

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328422208_YggBb2zV)

### **文本**

#### **wrap(多行文本)**

- a. 多行文本的效果图如下（wrap:true）

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328422377_zZaVvNW2)

- b. 单行文本的效果图如下(wrap:false)

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328422529_2in7bi9p)

#### **hideText(隐藏文本)**

是否在条形码或二维码下面显示文本，bool类型（true为隐藏文本，false为显示文本），默认为隐藏文本。

#### **lineHeight(行高)**

行高为一行的高度，包括文本的字体实际高度和上下空白高度，支持以下类型：  
* 百分比：如 150% 是默认高度的1.5倍；  
效果图如下：

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328422690_2RDQ4cZs)

#### **direction(文本方向)**

- a. 从左到右效果图如下图(direction: ltr)

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328422926_vWJU6a7L)

- b. 从右到左效果如下图(direction :rtl)

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328423075_0GzOt7ef)

#### **orientation(文本的排版方向)**

表示文本的横排（horizontal）和竖排（vertical）枚举值。

- a.横排效果图如下图(orientation: horizontal)  
    ![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328423236_ZxDMIIkd)

- b.竖排效果如下图(orientation :vertical)  
    ![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328423427_MR0JUcRF)

### **线条与边框**

#### **lineColor(线条颜色)**

线条的颜色，字符串类型，颜色由一个十六进制符号来定义，这个符号由红色、绿色、蓝色的值组成(RGB)。每种颜色的最小值是0(十六进制：#00)，最大值255(十六进制：#FF)。格式为#rrggbb。如lineColor: #00FF00。  
默认为黑色 lineColor:#000000。

#### **lineWidth(线条宽度)**

线条的宽度，单位pt和mm均可，缺省为pt，建议使用pt，如“lineWidth:3pt”。

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328423667_N105MHVA)

#### **lineType(线条类型)**

- a. 实线效果如下图(“lineType:solid”)

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328423903_GbEWlVJm)

- b. 破折线效果如下图(“lineType:dashed”)

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328424143_EKQYNAzF)

- c. 点线效果如下图(“lineType:dotted”)

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328424461_SDrFmu6c)

#### **borderWidth(边框宽度)**

单位pt和mm均可，缺省为pt，建议使用pt。

- a. borderWidth:1pt 2pt 3pt 4pt，表示上边框宽度1pt，右边框宽度2pt，下边框宽度3pt，左边框宽度4pt。

- b. borderWidth:1pt 2pt 3pt，表示上边框宽度1pt，左右边框宽度2pt，下边框的宽度3pt。

- c. borderWidth:1pt 2pt，表示上下边框宽度1pt，左右边框宽度2pt。

- d. borderWidth:1pt ，表示上下左右边框宽度1pt。

#### **borderStyle(边框样式)**

边框样式，取值为枚举值（solid/dashed/dotted）。

- a. 如borderStyle: solid dashed dotted solid

上线条实线，右线条破折线，下线条点线，左线条实线。

- b. 如borderStyle:solid dashed dotted

上线条实线，左右线条破折线，下线条点线。

- c. 如borderStyle:solid dashed

上下线条实线，左右线条破折线。

- d. 如borderStyle:solid

上下左右线条实线。

### **其他样式**

#### **zIndex(图层)**

控制元素的上下顺序，整数型，数值越大则图层越高，离用户越近。  
只有layout元素上有zIndex属性，如果缺省默认为0。  
zIndex取值范围为:[-2147483648,2147483647]。

#### **alpha(透明度)**

控件的透明度百分比，浮点型，值范围0至1，0为完全透明，1为完全不透明。如alpha:0.6。

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328424756_VB3VmGz9)

??注意：在实际打印中透明度由打印机驱动实现，若驱动不支持透明度设置，则带有透明度的控件是否显示完全由驱动控制

#### **rotation(旋转)**

顺时针旋转角度，浮点型，单位为度。如rotation:90.5。效果图如下：

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328425118_mxMLmSLc)

#### **overflow(超出处理)**

布局内的元素超出布局的处理方式，枚举值（hidden隐藏，visible显示），缺省为overflow:visible。

- a. 隐藏效果如下图(如overflow:hidden)

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328425532_Cn1sVuNG)

- b. 显示效果如下图(如overflow:visible)

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328425780_i8O5qwq7)

#### **backgroundColor(背景色)**

背景色，字符串类型，颜色由一个十六进制符号来定义，这个符号由红色、绿色、蓝色的值组成(RGB)。每种颜色的最小值是0(十六进制：#00)，最大值255(十六进制：#FF)。  
格式为#rrggbb，默认白色 backgroundColor:#FFFFFF。

2018 cainiao.com 版权所有。  
未经允许，不得进行任何形式的修改、传播等行为。菜鸟网络保留修改权利。

# **动态内容规范**

## **JS代码片段嵌入**

为了支持动态内容，支持通过<%%>嵌入js代码，但需要注意的是js代码需要遵循[ES5规范](https://www.w3school.com.cn/js/js_es5.asp)，不支持let、foreach等语法

也可以通过<%=%>获取上文中定义的变量

### **循环**

通过for可以实现循环生成标签，语法样例如下

```
<!--list=["a","b","c"]-->
<%for(var i=0;i<list.length;i++){%>
<layout>
  <text  value="<%=list[i]%>"></text>
</layout>
<%}%>
```

生成后

```
<layout>
  <text  value="a"></text>
</layout>
<layout>
  <text  value="b"></text>
</layout>
<layout>
  <text  value="c"></text>
</layout>
```

### **判断**

通过if可以实现条件展示，语法样例如下

```
<%if(condi){%>
<layout>
  <text value="在condi成立时"></text>
</layout>
<%}else{%>
  <layout>
  <text value="在condi不成立时"></text>
</layout>
<%}%>
```

最终只会展示其中一个

```
<layout>
  <text value="在condi不成立时"></text>
</layout>
```

### **取值**

通过<%=xx%>可以直接取值

```
<!--aValue=abc-->
<text value="<%=aValue%>"/>
```

最终展示效果为

```
<text value="abc"/>
```

### **预定义变量**

在菜鸟云打印标记语言中，预先定义了若干个变量，可以在代码片段中直接使用这些变量

#### **外部数据_data**

可以通过**_data**来访问外部数据，_data是json结构，值为通过菜鸟云打印交互协议传入的data变量或encryptedData变量解密后的值。

#### **配置信息**_config

定义了打印机配置的信息，目前可用以下两个属性

|   |   |
|---|---|
|needTopLogo|是否需要模板上联的快递logo（可由打印机配置中更改）；|
|needBottomLogo|是否需要模板下联的快递logo（可由打印机配置中更改）|

#### **上下文 _context**

定义了一些函数，可用于获取上下文信息

|   |   |
|---|---|
|formatStartTime(fmt)|任务开始打印时间，fmt参数是时间格式化模式|
|documentNumber()|当前打印的页数|
|documentCount()|打印总页数|

fmt支持如下格式化模式：

- 年(y)可以用2或4个占位符

- 月(M)可以用1或2个占位符

- 日(d)可以用1或2个占位符

- 时(h)12小时制,可以用1或2个占位符

- 时(H)24小时制,可以1或2个占位符

- 分(m)可以用1或2个占位符

- 秒(s)可以用1或2个占位符

- 毫秒(S)只能用1个占位符（是1-3位的数字）

- 周(E)可以用1或2或3个占位符  
    使用示例如下：  
    _context.formatStartTime(“yyyy-MM-dd hh:mm:ss.S”)==> 2006-07-02 08:09:04.423  
    _context.formatStartTime(“yyyy-MM-dd E HH:mm:ss”) ==> 2009-03-10 二 20:09:04  
    _context.formatStartTime(“yyyy-MM-dd EE hh:mm:ss”) ==> 2009-03-10 周二 08:09:04  
    _context.formatStartTime(“yyyy-MM-dd EEE hh:mm:ss”) ==> 2009-03-10 星期二 08:09:04  
    _context.formatStartTime(“yyyy-M-d h:m:s.S”) ==> 2006-7-2 8:9:4.18  
    _context.formatStartTime(“yyyy-MM-dd hh:mm:ss”) ==> 2006-07-02 08:09:04  
    _context.formatStartTime(“yyyy/MM/dd hh:mm:ss”) ==> 2016/07/08 03:20:52  
    _context.formatStartTime(“yyyy-MM-dd”) ==> 2006-07-02  
    _context.formatStartTime(“hh:mm:ss”) ==> 08:09:04

## **最佳实践**

动态内容的最佳实践是仅在菜鸟云打印标记语言中通过代码片段控制元素的显示，而不要在菜鸟云打印标记语言中进行数据的处理以及业务逻辑的片段

## **表格中的单元格显示成跨行跨列**

样例如下

![](https://wirelsee-weex-tasp-public-oss.oss-cn-hangzhou.aliyuncs.com/oss_1748328465306_INh5jXbx)

表格行列数规则

1. 如果设置了th行，则th的数量就是列的数量

2. 如果没有设置th行，则表格中所有tr的最大列数为表格的列数（如果td有跨列设置，则此td表示多列，如跨3列，则td表示3列，如果同时有跨行列，则下一行的列数需要加上此跨列的td的列数量，例如第一行跨2行3列，则第二行计算完所有td的列数后还需要加上跨行增加的3列）

3. 表格的行数取决于tr的数量

??如果**希望表格****一共6列，第一行跨3列跨2行，第二行就只剩下3列可以用了**

## **自适应布局和浮动元素**

在CNPL中没有设置top和left的元素称为浮动元素，在一个layout中，多个浮动元素会合并计算位置，如果在layout中同时包含浮动和固定元素，不影响浮动元素的位置计算。

??在1.5.2版本后，如果没有设置top则称为纵向浮动元素，如果没有设置left则称为横向浮动元素

- 在layout设置垂直布局时，纵向浮动元素和浮动元素一起计算元素的确切位置

- 在layout设置水平布局时，横向浮动元素和浮动元素一起计算元素的确切位置

计算位置的算法如下：

首先计算所有浮动元素的width（水平布局）、height（垂直布局）得到总宽或总高，然后求当前元素的width（水平布局）、height（垂直布局），随后将当前元素的width或height按比例分配给所有浮动元素，最后将所有浮动元素按照zIndex顺序进行排列，给每个浮动元素赋予left和width（水平布局，如果浮动元素没有height，则用当前元素的height赋予浮动元素）、top（垂直布局，如果浮动元素没有width，则用当前元素的width赋予浮动元素）