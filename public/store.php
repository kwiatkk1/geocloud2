<?php
include("html_header.php");
?>
<link rel="stylesheet" type="text/css" href="/js/ext/resources/css/ext-all-notheme.css?51cabb17d7568573"/>
<link rel="stylesheet" type="text/css" href="/js/ext/resources/css/xtheme-gray.css?49593e1feb591d0b"/>
<link rel="stylesheet" type="text/css" href="/js/ext/examples/shared/icons/silk.css?84655ed526dfbc2a"/>
<link rel="stylesheet" type="text/css" href="/js/ext/examples/ux/css/Spinner.css?35ea7a99ab8c2113"/>
<link rel="stylesheet" type="text/css" href="/js/bootstrap/css/bootstrap.icons.min.css?946b6da947019f90"/>
<link rel="stylesheet" type="text/css" href="/css/jquery.plupload.queue.css?0883487d9fdc30c9"/>
<!-- build:css /css/build/styles.min.css -->
<link rel="stylesheet" type="text/css" href="/css/styles.css?ab029c0ff82bf6ab"/>
<!-- /build -->
</head>
<body>
<div style="display:none">
    <div id="map-settings"></div>
    <div id="authentication">
        HTTP Basic auth password for WMS and WFS
    </div>
    <div id="apikey">
        API key. This is used for the SQL API. You can always change the key
        <br>
        <br>
        <b><span id='apikeyholder'></span></b>
    </div>
    <div id="wfs-dialog">
        <table border="0" class="pretty-tables">
            <tbody>
            <tr>
                <td>Use this string in GIS that supports WFS:</td>
            </tr>
            <tr>
                <td>
                    <input type="text" readonly="readonly"
                           value="<?php echo \app\conf\App::$param['protocol'] ?: "http" ?>://<?php echo $_SERVER['HTTP_HOST']; ?>/wfs/<?php echo ($_SESSION['subuser'] ? $_SESSION['subuser'] . "@" : "") . $_SESSION['screen_name']; ?>/<?php echo (\app\inc\Input::getPath()->part(3)) ? \app\inc\Input::getPath()->part(3) : "public"; ?>/<?php echo (\app\conf\App::$param["epsg"]) ?: "4326" ?>"
                           size="65"/>
                </td>
            </tr>
            </tbody>
        </table>
    </div>
    <div id="wms-dialog">
        <table border="0">
            <tbody>
            <tr>
                <td>Use this string in GIS that supports WMS:</td>
            </tr>
            <tr>
                <td>
                    <input type="text" readonly="readonly"
                           value="<?php echo \app\conf\App::$param['protocol'] ?: "http" ?>://<?php echo $_SERVER['HTTP_HOST']; ?>/wms/<?php echo ($_SESSION['subuser'] ? $_SESSION['subuser'] . "@" : "") . $_SESSION['screen_name']; ?>/<?php echo (\app\inc\Input::getPath()->part(3)) ? \app\inc\Input::getPath()->part(3) : "public"; ?>/"
                           size="65"/>
                </td>
            </tr>
            </tbody>
        </table>
    </div>
    <div id="tms-dialog">
        <table border="0">
            <tbody>
            <tr>
                <td>Use this string in GIS that supports TMS (Google style):</td>
            </tr>
            <tr>
                <td>
                    <input type="text" readonly="readonly"
                           value="<?php echo \app\conf\App::$param['protocol'] ?: "http" ?>://<?php echo $_SERVER['HTTP_HOST']; ?>/wms/mydb/tilecache/1.0.0/{layer}/7/32/25.png"
                           size="65"/>
                </td>
            </tr>
            </tbody>
        </table>
    </div>
    <div id="sql-dialog">
        <table border="0">
            <tbody>
            <tr>
                <td>This is the SQL API end point:</td>
            </tr>
            <tr>
                <td>
                    <input type="text" readonly="readonly"
                           value="<?php echo \app\conf\App::$param['protocol'] ?: "http" ?>://<?php echo $_SERVER['HTTP_HOST']; ?>/api/v1/sql/<?php echo ($_SESSION['subuser'] ? $_SESSION['subuser'] . "@" : "") . $_SESSION['screen_name']; ?>?q=[query]&key=[your_api_key]"
                           size="65"/>
                </td>
            </tr>
            </tbody>
        </table>
    </div>
    <div id="elasticsearch-dialog">
        <table border="0">
            <tbody>
            <tr>
                <td>This is the elasticsearch API end point:</td>
            </tr>
            <tr>
                <td>
                    <input type="text" readonly="readonly"
                           value="<?php echo \app\conf\App::$param['protocol'] ?: "http" ?>://<?php echo $_SERVER['HTTP_HOST']; ?>/api/v1/elasticsearch/[map|bulk|search|delete]/<?php echo $_SESSION['screen_name']; ?>/[index]/[type]"
                           size="65"/>
                </td>
            </tr>
            <tr>
                <td>map: PUT, bulk: POST, search: GET, delete: DELETE</td>
            </tr>
            </tbody>
        </table>
    </div>
</div>
<div id="spinner"><span></span><img src='/assets/images/ajax_loader.gif'/></div>
<script type="text/javascript" src="/api/v1/baselayerjs"></script>
<script>window.__ = function (string, toolTip) {
        'use strict';
        var str;
        if (typeof gc2i18n !== 'undefined') {
            if (gc2i18n.dict[string]) {
                str = gc2i18n.dict[string];
            } else {
                str = string;
            }
            if (toolTip) {
                str = " <span class='tt' ext:qtip='" + string + "' ext>[?]</span>";
            }
        }
        return str;
    };
    document.write("<script src='/js/i18n/" + window.gc2Al + ".js'><\/script>");
</script>
<script type="text/javascript" src="/js/ext/adapter/ext/ext-base.js?7453012a468a8a38"></script>
<script type="text/javascript" src="/js/ext/ext-all.js?0035a5fa730b0514"></script>
<script type="text/javascript" src="/js/ext/examples/ux/Spinner.js?00006e0276bf36d4"></script>
<script type="text/javascript" src="/js/ext/examples/ux/SpinnerField.js?12cd89e35dc66bc2"></script>
<script type="text/javascript" src="/js/ext/examples/ux/CheckColumn.js?7ba8b5b8eb4a6981"></script>
<!-- build:js /js/build/store/all.min.js -->
<script type="text/javascript" src="/js/jquery/1.10.0/jquery.min.js?c1c829b72179d9c3"></script>
<script type="text/javascript" src="/js/msg.js?e6ae61b3f174052d"></script>
<script type="text/javascript" src="/js/store.js?0f1577ecda4c58c2"></script>
<script type="text/javascript" src="/js/edittablestructure.js?dd0fee710d915275"></script>
<script type="text/javascript" src="/js/cartomobilesetup.js?18b434a3917cddf4"></script>
<script type="text/javascript" src="/js/editwmsclass.js?657470fc27ac6e4f"></script>
<script type="text/javascript" src="/js/editwmslayer.js?6cd3fec277824e02"></script>
<script type="text/javascript" src="/js/classwizards.js?1d00b17572d800a0"></script>
<script type="text/javascript" src="/js/addshapeform.js?b101181cffcb21dc"></script>
<script type="text/javascript" src="/js/addbitmapform.js?53b6dfd2a63ab812"></script>
<script type="text/javascript" src="/js/addrasterform.js?af3d3b37eda75007"></script>
<script type="text/javascript" src="/js/addfromscratch.js?e4a993729b4639ad"></script>
<script type="text/javascript" src="/js/addviewform.js?d223f9da67a51165"></script>
<script type="text/javascript" src="/js/addosmform.js?6fa514ebc5d91d01"></script>
<script type="text/javascript" src="/js/colorfield.js?4c80541098c1f93d"></script>
<script type="text/javascript" src="/js/httpauthform.js?f68874434ef507cc"></script>
<script type="text/javascript" src="/js/apikeyform.js?255f5386bda54d03"></script>
<script type="text/javascript" src="/js/plupload/js/moxie.min.js?5eb0c30ea42430c9"></script>
<script type="text/javascript" src="/js/plupload/js/plupload.min.js?745552fc001e46c4"></script>
<script type="text/javascript"
        src="/js/plupload/js/jquery.plupload.queue/jquery.plupload.queue.min.js?78b92aab54b9f806"></script>
<!-- /build -->
</body>
</html>

