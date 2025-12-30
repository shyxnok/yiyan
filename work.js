addEventListener('fetch', event => {
    event.respondWith(getInfo(event.request))
  })
  
  async function getInfo(request) {
    try {
        const urlObj = new URL(request.url);
         if (urlObj.pathname === "/") {
              // 根路径：返回自定义 HTML 网页
              const htmlContent = `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>一言服务首页</title>
      <style>
          /* 自定义网页样式，可按需修改 */
          * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
          }
          body {
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background-color: #f5f5f5;
              font-family: "Microsoft YaHei", sans-serif;
              color: #333;
          }
          .container {
              text-align: center;
              padding: 2rem 4rem;
              background-color: #fff;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          h1 {
              font-size: 2.5rem;
              margin-bottom: 1.5rem;
              color: #2c3e50;
          }
          .desc {
              font-size: 1.2rem;
              margin-bottom: 2rem;
              color: #666;
          }
          .example {
              font-size: 1rem;
              padding: 1rem 2rem;
              background-color: #f8f9fa;
              border-radius: 8px;
              color: #2d3436;
              font-family: "Consolas", monospace;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <h1>一言服务</h1>
          <p class="desc">欢迎使用一言接口，访问以下路径获取随机语录</p>
          <div class="example">
              示例：<a href="/i" target="_blank">${urlObj.origin}/i</a>
              <br>
              格式：JSON（支持自定义路径分类）
          </div>
      </div>
  </body>
  </html>
              `;
  
              // 配置网页响应头
              const htmlHeaders = new Headers();
              htmlHeaders.set("Access-Control-Allow-Origin", "*");
              // 禁止浏览器缓存网页（可选，按需调整）
              htmlHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
              // 关键：设置响应类型为 HTML
              htmlHeaders.set("Content-Type", "text/html; charset=utf-8");
  
              // 返回 HTML 网页
              return new Response(htmlContent, {
                  status: 200,
                  headers: htmlHeaders
              });
          }
  
        const targetPath = (urlObj.pathname).slice(1);
        let sentencesPath = "";
        const hitokotoRes = await fetch("https://raw.githubusercontent.com/Codebglh/yiyan/refs/heads/main/categories.json", {
            method: "GET",
            signal: AbortSignal.timeout(5000)
        });
        if (!hitokotoRes.ok) {
            throw new Error(`远程接口请求失败：${hitokotoRes.status}`);
        }
        const hitokotoData = await hitokotoRes.json();
        let items=[];
        for (const item of hitokotoData) {
            items.push(item.key);
            if (targetPath === item.key) {
                sentencesPath = item.path;
                break;
            }
        }
        if (items.includes(targetPath)) {
            sentencesPath = `./sentences/${targetPath}.json`;
        } else {
            sentencesPath = './all.json';
        }
        sentencesPath = 'https://raw.githubusercontent.com/Codebglh/yiyan/refs/heads/main' + sentencesPath.replace('./', '/')
        const sentencesRes = await fetch(sentencesPath, {
            method: "GET",
            signal: AbortSignal.timeout(5000)
        });
        let sentencesData = await sentencesRes.json()
        if (!sentencesRes.ok) {
            throw new Error(`远程接口请求失败：${sentencesRes.status}`);
        }
        let randomHitokoto;
        if (Array.isArray(sentencesData)) {
            const randomIndex = Math.floor(Math.random() * sentencesData.length);
            randomHitokoto = sentencesData[randomIndex];
        } else {
            const allHitokoto = [];
            Object.values(sentencesData).forEach(categoryList => {
                if (Array.isArray(categoryList)) {
                    allHitokoto.push(...categoryList);
                }
            });
            if (allHitokoto.length === 0) {
                throw new Error("一言数据源为空");
            }
            const randomIndex = Math.floor(Math.random() * allHitokoto.length);
            randomHitokoto = allHitokoto[randomIndex];
        }
        const headers = new Headers();
        headers.set("Access-Control-Allow-Origin", "*");
        headers.set("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
        headers.set("Content-Type", "application/json; charset=utf-8");
        return new Response(JSON.stringify(randomHitokoto, null, 2), {
            status: 200,
            headers
        });
  
        // 格式 2：返回纯文本格式（需确保 randomHitokoto 可转为有效字符串）
        // let textContent;
        // if (typeof randomHitokoto === "object") {
        //     // 若随机结果是对象（含 content/author 字段），拼接为纯文本
        //     textContent = `${randomHitokoto.content || randomHitokoto} —— ${randomHitokoto.author || randomHitokoto.from || "佚名"}`;
        // } else {
        //     // 若随机结果是字符串，直接返回
        //     textContent = randomHitokoto;
        // }
        // headers.set("Content-Type", "text/plain; charset=utf-8");
        // return new Response(textContent, { status: 200, headers });
  
    } catch (error) {
        const errorHeaders = new Headers();
        errorHeaders.set("Access-Control-Allow-Origin", "*");
        errorHeaders.set("Content-Type", "text/plain; charset=utf-8");
        return new Response(`接口请求失败：${error.message}`, {
            status: 500,
            headers: errorHeaders
        });
    }
  }