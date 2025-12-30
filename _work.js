addEventListener("fetch", (event) => {
  event.respondWith(getInfo(event.request));
});

async function getInfo(request) {
  try {
    const urlObj = new URL(request.url);
    if (urlObj.pathname === "/") {
      const hasQueryParams = urlObj.searchParams.toString() !== "";
      // 纯根路径（无参数）：返回主页
      if (!hasQueryParams) {
        const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>一言接口服务</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f5f5f5; font-family: "Microsoft YaHei", sans-serif; color: #333; }
        .container { padding: 2rem 4rem; background: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; }
        h1 { color: #2c3e50; margin-bottom: 1.5rem; }
        .desc { font-size: 1.1rem; color: #666; margin-bottom: 2rem; }
        .param { text-align: left; background: #f8f9fa; padding: 1rem 1.5rem; border-radius: 8px; margin-bottom: 1rem; }
        .example { font-family: Consolas, monospace; margin-top: 1rem; color: #2d3436; }
    </style>
</head>
<body>
    <div class="container">
        <h1>一言接口服务</h1>
        <p class="desc">支持多类型语录查询，可通过参数切换格式和编码</p>
        <div class="param">
            <p><strong>参数说明：</strong></p>
            <p>type：语录类型（Anime/Comic/Game/Literature/Original 等，默认 All）</p>
            <p>encode：返回格式（json/text/base64/url，默认 json）</p>
            <p>charset：编码格式（utf-8/gbk/gb2312，默认 utf-8）</p>
        </div>
        <div class="example">
            示例：<a href="?type=Anime&encode=text" target="_blank">${urlObj.origin}?type=Anime&encode=text</a>
        </div>
    </div>
</body>
</html>
      `;
        const htmlHeaders = new Headers();
        htmlHeaders.set("Access-Control-Allow-Origin", "*");
        htmlHeaders.set(
          "Cache-Control",
          "no-cache, no-store, must-revalidate, max-age=0"
        );
        htmlHeaders.set("Content-Type", "text/html; charset=utf-8");
        return new Response(htmlContent, { status: 200, headers: htmlHeaders });
      }
    }

    // 2. 核心判断：是否无任何查询参数（关键逻辑）
    const hasNoQueryParams = urlObj.searchParams.toString() === "";
    if (hasNoQueryParams) {
      // 无参数时：重定向到根路径主页，并可添加提示
      const redirectHeaders = new Headers();
      // 选项1：静默重定向（直接跳转，无文字提示）
      return Response.redirect(`${urlObj.origin}/`, 302);
    }
    // 核心：校验 type 参数是否存在（必传校验）
    const hasTypeParam = urlObj.searchParams.has("type");
    if (!hasTypeParam) {
      // 缺失 type 参数：重定向到主页
      return Response.redirect(`${urlObj.origin}/`, 302);
    }
    const typeParam = urlObj.searchParams.get("type") || "default"; // 提取 type 参数
    const encodeParam = urlObj.searchParams.get("encode") || "json"; // 提取 encode 参数
    const charsetParam = urlObj.searchParams.get("charset") || "utf-8"; // 提取 charset 参数
    const contentParam = urlObj.searchParams.get("content")||""; // 提取 content 参数
    let contentParamlist=contentParam.split("@");
    let typePath = "";
    const supportedTypes = [
      "Anime",
      "Comic",
      "Game",
      "Literature",
      "Original",
      "Internet",
      "Other",
      "Video",
      "Poem",
      "NCM",
      "Philosophy",
      "Funny",
      "All",
    ];
    const hasAtSeparator =
      typeof typeParam === "string" && typeParam.includes("@");
    let sentencesData = [];
    if (hasAtSeparator) {
      let item = typeParam.split("@");
      for (let i = 0; i < item.length; i++) {
        let type = item[i].trim();
         if (!type || !supportedTypes.includes(type)) {
          continue; // 跳过无效类别，继续遍历
        }
        typePath = `/sentences/${type}.json`;
        let sentencesPath =
          "https://raw.githubusercontent.com/shyxnok/yiyan/refs/heads/main" +
          typePath;
        const sentencesRes = await fetch(sentencesPath, {
          method: "GET",
          signal: AbortSignal.timeout(5000),
        });
        if (!sentencesRes.ok) {
          throw new Error(`远程接口请求失败：${sentencesRes.status}`);
        }

        sentencesData = sentencesData.concat(await sentencesRes.json());
      }
    } else {
      switch (typeParam) {
        case "Anime":
          typePath = "/sentences/Anime.json";
          break;
        case "Comic":
          typePath = "/sentences/Comic.json";
          break;
        case "Game":
          typePath = "/sentences/Game.json";
          break;
        case "Literature":
          typePath = "/sentences/Literature.json";
          break;
        case "Original":
          typePath = "/sentences/Original.json";
          break;
        case "Internet":
          typePath = "/sentences/Internet.json";
          break;
        case "Other":
          typePath = "/sentences/Other.json";
          break;
        case "Video":
          typePath = "/sentences/Video.json";
          break;
        case "Poem":
          typePath = "/sentences/Poem.json";
          break;
        case "NCM":
          typePath = "/sentences/NCM.json";
          break;
        case "Philosophy":
          typePath = "/sentences/Philosophy.json";
          break;
        case "Funny":
          typePath = "/sentences/Funny.json";
          break;
        default:
          typePath = "/sentences/All.json";
          break;
      }
      let sentencesPath =
        "https://raw.githubusercontent.com/shyxnok/yiyan/refs/heads/main" +
        typePath;
      const sentencesRes = await fetch(sentencesPath, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      if (!sentencesRes.ok) {
        throw new Error(`远程接口请求失败：${sentencesRes.status}`);
      }
      let data = await sentencesRes.json();
      sentencesData = sentencesData.concat(data);
    }

    let randomYiyan;
    if (Array.isArray(sentencesData)) {
      const randomIndex = Math.floor(Math.random() * sentencesData.length);
      randomYiyan = sentencesData[randomIndex];
    } else {
      const allYiyan = [];
      Object.values(sentencesData).forEach((categoryList) => {
        if (Array.isArray(categoryList)) {
          allYiyan.push(...categoryList);
        }
      });
      if (allYiyan.length === 0) {
        throw new Error("一言数据源为空");
      }
      const randomIndex = Math.floor(Math.random() * allYiyan.length);
      randomYiyan = allYiyan[randomIndex];
    }
    let responseContent = "";

    const headers = new Headers();
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate, max-age=0"
    );
    headers.set("Content-Type", "application/json; charset=utf-8");

    switch (encodeParam) {
      case "text":
        const supportedFields1 = [
            'id', 'yiyan', 'type', 'from', 'from_who',
            'creator', 'creator_uid', 'reviewer', 'created_at'
            ];
            // 2. 标记是否匹配到字段
        let hasMatchedField1 = false;
        supportedFields1.forEach(field => {
          // 判断：1. contentParamlist 包含该字段  2. randomYiyan 存在该字段且值非 undefined/null
          if (contentParamlist.includes(field) && randomYiyan.hasOwnProperty(field) && randomYiyan[field] !== undefined && randomYiyan[field] !== null) {
            responseContent +=field + ":"+ randomYiyan[field]+"\n"; // 方括号语法，动态赋值
            hasMatchedField1 = true;
          }
        });

        
        // 4. 整体兜底：无任何字段匹配时，赋值 randomYiyan
        if (!hasMatchedField1) {
           responseContent = `${randomYiyan.yiyan } —— ${
            randomYiyan.from_who || "佚名"
          }`;
        }
        headers.set(`Content-Type`, `text/plain; charset=${charsetParam}`);
        break;
      case "base64":
        const jsonStr = JSON.stringify(randomYiyan, null, 2);
        responseContent = btoa(unescape(encodeURIComponent(jsonStr)));
        headers.set(`Content-Type`, `text/plain; charset=${charsetParam}`);
        break;
 
      default:
        let a = {};
        // 1. 定义支持的字段列表（新增字段只需在这里添加，扩展性强）
        const supportedFields = [
          'id', 'yiyan', 'type', 'from', 'from_who',
          'creator', 'creator_uid', 'reviewer', 'created_at'
        ];
        // 2. 标记是否匹配到字段
        let hasMatchedField = false;
        
        // 3. 遍历支持的字段，批量添加（替代多个 if 判断，简化代码）
        supportedFields.forEach(field => {
          // 判断：1. contentParamlist 包含该字段  2. randomYiyan 存在该字段且值非 undefined/null
          if (contentParamlist.includes(field) && randomYiyan.hasOwnProperty(field) && randomYiyan[field] !== undefined && randomYiyan[field] !== null) {
            a[field] = randomYiyan[field]; // 方括号语法，动态赋值
            hasMatchedField = true;
          }
        });
        
        // 4. 整体兜底：无任何字段匹配时，赋值 randomYiyan
        if (!hasMatchedField) {
          a = randomYiyan;
        }
        responseContent = JSON.stringify(a, null, 2);


        headers.set(
          `Content-Type`,
          `application/json; charset=${charsetParam}`
        );
        break;
    }
  
    return new Response(responseContent, {
      status: 200,
      headers: headers,
    });
  } catch (error) {
    const errorHeaders = new Headers();
    errorHeaders.set("Access-Control-Allow-Origin", "*");
    errorHeaders.set("Content-Type", "text/plain; charset=utf-8");
    return new Response(`接口请求失败：${error.message}`, {
      status: 500,
      headers: errorHeaders,
    });
  }
}

function log(x) {
  console.log(x);
}
