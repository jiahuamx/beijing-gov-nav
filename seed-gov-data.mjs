import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { govCategories, govProjects, feeStandards } from "./drizzle/schema.ts";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

async function seedDatabase() {
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  try {
    console.log("开始导入政务办理数据...");

    // 1. 插入分类
    const categoryData = [
      {
        name: "工商注册",
        description: "企业营业执照、个体工商户等工商相关事务",
        icon: "briefcase",
        order: 1,
      },
      {
        name: "税务办理",
        description: "税务登记、发票申领、税务申报等税务相关事务",
        icon: "calculator",
        order: 2,
      },
      {
        name: "社保公积金",
        description: "企业社保登记、住房公积金缴存等社保相关事务",
        icon: "shield",
        order: 3,
      },
      {
        name: "人事服务",
        description: "职工培训补贴、劳动合同备案等人事相关事务",
        icon: "users",
        order: 4,
      },
      {
        name: "许可证办理",
        description: "各类经营许可证、资质证书等许可相关事务",
        icon: "certificate",
        order: 5,
      },
    ];

    console.log("插入分类...");
    for (const cat of categoryData) {
      await db.insert(govCategories).values(cat);
    }

    // 2. 获取分类ID
    const categories = await db.select().from(govCategories);
    const categoryMap = Object.fromEntries(
      categories.map((c) => [c.name, c.id])
    );

    // 3. 插入政务项目
    const projectsData = [
      // 工商注册
      {
        categoryId: categoryMap["工商注册"],
        name: "企业营业执照办理",
        description: "新设立企业的营业执照申请和办理",
        materials: JSON.stringify([
          "法定代表人身份证原件及复印件",
          "公司名称预先核准通知书",
          "公司章程",
          "股东会决议",
          "经营地址证明（房产证或租赁合同）",
          "法人及股东联系方式",
        ]),
        steps: JSON.stringify([
          "1. 公司名称核准（1-3个工作日）",
          "2. 准备申请材料",
          "3. 通过e窗通平台提交申请",
          "4. 工商部门审核（3-7个工作日）",
          "5. 领取营业执照",
        ]),
        timeRequired: "3-7个工作日",
        fees: 0,
        notes: "可通过北京企业登记e窗通平台在线办理，最快3天拿证",
        url: "https://www.bjcredit.gov.cn/",
      },
      {
        categoryId: categoryMap["工商注册"],
        name: "个体工商户营业执照办理",
        description: "个体工商户的营业执照申请和办理",
        materials: JSON.stringify([
          "申请人身份证原件及复印件",
          "经营地址证明",
          "个体工商户登记申请书",
        ]),
        steps: JSON.stringify([
          "1. 准备申请材料",
          "2. 提交至市场监督管理局",
          "3. 部门审核（1-3个工作日）",
          "4. 领取营业执照",
        ]),
        timeRequired: "1-3个工作日",
        fees: 20,
        notes: "登记费20元/户，下岗人员可申请免费",
        url: "https://banshi.beijing.gov.cn/",
      },
      {
        categoryId: categoryMap["工商注册"],
        name: "营业执照变更",
        description: "企业营业执照信息的变更申请",
        materials: JSON.stringify([
          "营业执照原件",
          "变更申请书",
          "相关证明材料",
          "法定代表人身份证复印件",
        ]),
        steps: JSON.stringify([
          "1. 准备变更材料",
          "2. 通过e窗通平台提交",
          "3. 工商部门审核（3-5个工作日）",
          "4. 领取新的营业执照",
        ]),
        timeRequired: "3-5个工作日",
        fees: 0,
        notes: "变更项目包括：名称、经营范围、注册地址等",
        url: "https://www.bjcredit.gov.cn/",
      },
      {
        categoryId: categoryMap["工商注册"],
        name: "营业执照注销",
        description: "企业营业执照的注销申请",
        materials: JSON.stringify([
          "营业执照原件及复印件",
          "法定代表人身份证复印件",
          "注销申请书",
          "清算报告",
        ]),
        steps: JSON.stringify([
          "1. 准备注销材料",
          "2. 登报公告（45天）",
          "3. 提交注销申请",
          "4. 工商部门审核（5-10个工作日）",
          "5. 领取注销证明",
        ]),
        timeRequired: "45-60天",
        fees: 0,
        notes: "需要先完成税务注销、社保注销等相关手续",
        url: "https://banshi.beijing.gov.cn/",
      },

      // 税务办理
      {
        categoryId: categoryMap["税务办理"],
        name: "税务登记",
        description: "企业税务登记证的申请和办理",
        materials: JSON.stringify([
          "《税务登记表》",
          "营业执照复印件",
          "法定代表人身份证复印件",
          "经营地址证明",
          "公司章程或合伙协议",
        ]),
        steps: JSON.stringify([
          "1. 准备申请材料",
          "2. 提交至税务部门",
          "3. 税务部门审核（即时办结）",
          "4. 领取税务登记证",
        ]),
        timeRequired: "即时办结",
        fees: 25,
        notes: "企业获得营业执照后30天内应办理税务登记",
        url: "http://beijing.chinatax.gov.cn/",
      },
      {
        categoryId: categoryMap["税务办理"],
        name: "发票申领",
        description: "企业发票的申请和领取",
        materials: JSON.stringify([
          "营业执照复印件",
          "税务登记证复印件",
          "法定代表人身份证复印件",
          "财务负责人身份证复印件",
        ]),
        steps: JSON.stringify([
          "1. 完成税务登记",
          "2. 申请发票",
          "3. 税务部门审核（1-2个工作日）",
          "4. 领取发票",
        ]),
        timeRequired: "1-2个工作日",
        fees: 0,
        notes: "可申领增值税发票、普通发票等多种类型",
        url: "http://beijing.chinatax.gov.cn/",
      },

      // 社保公积金
      {
        categoryId: categoryMap["社保公积金"],
        name: "企业社会保险登记",
        description: "企业社会保险账户的开设和登记",
        materials: JSON.stringify([
          "营业执照复印件",
          "法定代表人身份证复印件",
          "经营地址证明",
          "员工身份证复印件",
        ]),
        steps: JSON.stringify([
          "1. 准备申请材料",
          "2. 提交至社保部门",
          "3. 社保部门审核（1-3个工作日）",
          "4. 领取社保登记证",
        ]),
        timeRequired: "1-3个工作日",
        fees: 0,
        notes: "企业应在获得营业执照后30天内办理社保登记",
        url: "https://www.beijing.gov.cn/",
      },
      {
        categoryId: categoryMap["社保公积金"],
        name: "住房公积金缴存登记",
        description: "企业住房公积金账户的开设和职工缴存",
        materials: JSON.stringify([
          "营业执照复印件",
          "法定代表人身份证复印件",
          "员工身份证复印件",
          "劳动合同复印件",
        ]),
        steps: JSON.stringify([
          "1. 企业开立公积金账户",
          "2. 为职工开立个人账户",
          "3. 按月缴存公积金",
          "4. 职工可申请提取或贷款",
        ]),
        timeRequired: "1-3个工作日",
        fees: 0,
        notes: "缴存比例由企业和职工协商确定，一般为5%-12%",
        url: "https://gjj.beijing.gov.cn/",
      },

      // 人事服务
      {
        categoryId: categoryMap["人事服务"],
        name: "企业职工技能培训补贴",
        description: "职工参加技能培训的补贴申请",
        materials: JSON.stringify([
          "企业营业执照复印件",
          "培训合同及发票",
          "职工身份证复印件",
          "培训成绩证明",
        ]),
        steps: JSON.stringify([
          "1. 职工参加培训",
          "2. 获得培训证书",
          "3. 准备申请材料",
          "4. 提交补贴申请",
          "5. 审核通过后领取补贴",
        ]),
        timeRequired: "15-30个工作日",
        fees: 0,
        notes: "大型企业补贴标准：每人每年不超过3000元，不超过培训总费用50%",
        url: "https://www.bjfsh.gov.cn/",
      },
      {
        categoryId: categoryMap["人事服务"],
        name: "劳动合同备案",
        description: "企业与职工劳动合同的备案登记",
        materials: JSON.stringify([
          "劳动合同原件及复印件",
          "职工身份证复印件",
          "企业营业执照复印件",
        ]),
        steps: JSON.stringify([
          "1. 企业与职工签订劳动合同",
          "2. 准备备案材料",
          "3. 提交至人力资源部门",
          "4. 完成备案（即时办结）",
        ]),
        timeRequired: "即时办结",
        fees: 0,
        notes: "劳动合同应在职工入职后30天内备案",
        url: "https://www.bjfsh.gov.cn/",
      },
    ];

    console.log("插入政务项目...");
    for (const proj of projectsData) {
      await db.insert(govProjects).values(proj);
    }

    // 4. 获取项目ID并插入收费标准
    const projects = await db.select().from(govProjects);

    const feeData = [
      {
        projectId: projects.find((p) => p.name === "企业营业执照办理")?.id || 0,
        serviceName: "营业执照工本费",
        fee: 0,
        basis: "免费（通过代理机构办理需支付代理费1000-2000元）",
        paymentMethod: "代理机构代收或自行支付",
        remarks: "包含营业执照正本和副本",
      },
      {
        projectId: projects.find((p) => p.name === "企业营业执照办理")?.id || 0,
        serviceName: "刻章费",
        fee: 300,
        basis: "市场价格",
        paymentMethod: "刻章店支付",
        remarks: "包括公章、财务章、法人章等",
      },
      {
        projectId: projects.find((p) => p.name === "个体工商户营业执照办理")?.id || 0,
        serviceName: "登记费",
        fee: 20,
        basis: "北京市工商行政管理局规定",
        paymentMethod: "现场支付",
        remarks: "下岗人员可申请免费",
      },
      {
        projectId: projects.find((p) => p.name === "税务登记")?.id || 0,
        serviceName: "税务登记证工本费",
        fee: 25,
        basis: "国家税务总局规定",
        paymentMethod: "现场支付",
        remarks: "每套25元",
      },
    ];

    console.log("插入收费标准...");
    for (const fee of feeData) {
      if (fee.projectId > 0) {
        await db.insert(feeStandards).values(fee);
      }
    }

    console.log("✅ 政务办理数据导入成功！");
  } catch (error) {
    console.error("❌ 数据导入失败:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedDatabase().catch(console.error);
