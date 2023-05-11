const axios = require('axios');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

const urls = [
  'https://suwako-hanabi.com/kojyou/tickets/',
  'https://suwako-hanabi.com/news/'
];

const emailConfig = {
  service: 'smtp.163.com',
  auth: {
    user: '17346545914@163.com',
    pass: 'INEOPFPQJLTRPHHR',
  },
};

const transporter = nodemailer.createTransport({
  host: emailConfig.service,
  secureConnection: true, 
  port: 465,
  secure: true, 
  auth: {
    user: emailConfig.auth.user,
    pass: emailConfig.auth.pass,
  },
});

let prevHtml = new Array(urls.length).fill('');

const sendEmail = async (url, changeSummary) => {
  try {
    const mailOptions = {
      from: emailConfig.auth.user,
      to: 'icanghai@foxmail.com',
      subject: `页面变更通知：${url}`,
      text: `页面发生变化: ${url}\n\n变化摘要:\n${changeSummary}`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`发送通知邮件成功: ${url}`);
  } catch (error) {
    console.error(`发送通知邮件失败: ${error.message}`);
  }
};

const detectChanges = async (url, index) => {
  try {
    const response = await axios.get(url);
    const html = response.data;

    if (prevHtml[index] === '') {
      prevHtml[index] = html;
      return;
    }

    if (html !== prevHtml[index]) {
      const $prev = cheerio.load(prevHtml[index]);
      const $curr = cheerio.load(html);

      let changeSummary = '';

      
      // 添加自定义的DOM分析逻辑，生成 changeSummary

      if (changeSummary === '') {
        changeSummary = '页面存在未指定的变化。';
      }

      await sendEmail(url, changeSummary);
      prevHtml[index] = html;
    }
  } catch (error) {
    console.error(`检测页面变化失败: ${error.message}`);
  }
};

// 将原monitorWebsites()函数代码修改为下面代码
module.exports = (req, res) => {
  urls.forEach((url, index) => {
    detectChanges(url, index);
  });
  res.status(200).send('OK');
};

cron.schedule('*/30 * * * *', () => {
  urls.forEach((url, index) => {
    detectChanges(url, index);
  });
});