# Lamar Core 2.1.1
- บอทใส่บทบาทเตือน ใบเหลือง ใบส้ม

# วิธีนำโค้ดไปใช้
## โคลน repo นี้
```
git clone https://github.com/jirapongSrijanyoo/Lamar_Core.git
```
เข้าไดเรทเทอรีของบอท
```
cd Lamar_Core
```
ติดตั้งแพ็กเกจโดยใช้ [NPM](https://www.npmjs.com/) หรือ [Bun](https://bun.sh/)
```
npm i discord.js dotenv systeminformation colorette pidusage
```
หากใช้ Bun
```
bun add discord.js dotenv systeminformation colorette pidusage
```
ใส่ token บอทและไอดีผู้ใช้ของคุณในไฟล์ .env
รันบอท
```
node .
```
หากใช้ Bun
```
bun run index.js
```
# ความต้องการ
- NodeJs หรือ Bun
- Discord Bot Token หาได้จาก [Discord Developers Portal](https://discord.com/developers/applications)
- Discord User ID หาได้จากการกดคัดลอกไอดีผู้ใช้
# คำสั่งของบอท
`/role_editor {role}` เพิ่มบทบาทสำหรับจัดการโดยต้องใส่ ใบเหลือง ใบส้ม และบทบาทแอดมินสำหรับให้คนที่มีบทบาทนี้ใช้คำสั่งได้

`/set_report_channel` สร้างห้องสำหรับรายงานการใส่และลบบทบาท `แนะนำปิดบอทป้องกันสแปมอย่าง Wick หรือ Dyno ก่อนใช้งาน`

`/manage_users {user}` จัดการผู้ใช้ เลือกให้บทบาทใบเหลือง ใบส้ม หรือแบน

- คำสั่งอื่นๆ `/ping` เช็คปิงของบอท `/info` ข้อมูลเกี่ยวกับบอท `/invite` เชิญบอทไปใช้งานในเซิร์ฟเวอร์อื่น
## ไม่อยากโฮสต์บอทเองหรอ?? ใช้บอทเราสิ
เชิญบอทไปใช้งาน [คลิกที่นี่](https://discord.com/oauth2/authorize?client_id=1270718428201877504)
## หากคุณสนใจเข้าร่วมเซิร์ฟเวอร์ Discord ของเรา
เข้าร่วมเซิร์ฟเวอร์ [คลิกที่นี่](https://discord.gg/cF3sXPHjzn)
## โปรดอ่าน เงื่อนไขการใช้และเอกสารลิขสิทธิ์
GNU General Public License (GPL) Copyright © 2024-2025 Lamar Core

โปรเจกต์นี้ได้รับการเผยแพร่ภายใต้เงื่อนไขดังต่อไปนี้:
1. Source code นี้เผยแพร่ภายใต้เงื่อนไขของ [GNU General Public License (GPL)](https://www.gnu.org/licenses/gpl-3.0.html)
2. คุณสามารถทำซ้ำ ดัดแปลง แก้ไข หรือแจกจ่าย source code นี้ได้อย่างอิสระ
3. หากมีการดัดแปลงหรือแก้ไขโค้ดนี้เพื่อใช้ในโปรเจกต์อื่น ๆ คุณต้องเผยแพร่โค้ดของโปรเจกต์นั้นในรูปแบบ open source ตามเงื่อนไขของ [GNU General Public License (GPL)](https://www.gnu.org/licenses/gpl-3.0.html)
4. การแจกจ่าย source code นี้ ไม่ว่าจะดัดแปลงหรือไม่ก็ตาม ต้องแนบเอกสารลิขสิทธิ์นี้มาด้วยทุกครั้ง
5. การไม่ปฏิบัติตามเงื่อนไขเหล่านี้ถือเป็นการละเมิดลิขสิทธิ์ และอาจถูกดำเนินการทางกฎหมาย

โปรดเคารพสิทธิ์ของผู้สร้าง หากมีข้อสงสัย กรุณาติดต่อ Discord: loma_0531

การละเมิดเงื่อนไขนี้อาจส่งผลให้มีการดำเนินการทางกฎหมายตามที่กฎหมายลิขสิทธิ์กำหนด

เอกสารเพิ่มเติม: [GNU General Public License (GPL)](https://www.gnu.org/licenses/gpl-3.0.html)
