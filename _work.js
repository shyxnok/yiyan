addEventListener("fetch", (event) => {
  event.respondWith(getInfo(event.request));
});

async function getInfo(request) {
  try {
    const urlObj = new URL(request.url);
    let path = urlObj.pathname;
    const typeParam = urlObj.searchParams.get("type") || "default"; // 提取 type 参数
    const encodeParam = urlObj.searchParams.get("encode") || "json"; // 提取 encode 参数
    const charsetParam = urlObj.searchParams.get("charset") || "utf-8"; // 提取 charset 参数
    let typePath = "";

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
      "https://raw.githubusercontent.com/Codebglh/yiyan/refs/heads/main" +
      typePath;
    const sentencesRes = await fetch(sentencesPath, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    if (!sentencesRes.ok) {
      throw new Error(`远程接口请求失败：${sentencesRes.status}`);
    }
    let sentencesData = await sentencesRes.json();
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
    switch (encodeParam) {
      case "base64":
        path = path.replace(/\.json$/, ".base64");
        break;
      case "url":
        path = path.replace(/\.json$/, ".url");
        break;
      default:
        path = path.replace(/\.json$/, ".json");
        break;
    }
    switch (charsetParam) {
      case "gbk":
        path = path.replace(/\.json$/, ".gbk");
        break;
      case "gb2312":
        path = path.replace(/\.json$/, ".gb2312");
        break;
      default:
        path = path.replace(/\.json$/, ".json");
        break;
    }
    const headers = new Headers();
        headers.set("Access-Control-Allow-Origin", "*");
        headers.set("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
        headers.set("Content-Type", "application/json; charset=utf-8");
        return new Response(JSON.stringify(randomYiyan, null, 2), {
            status: 200,
            headers
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
