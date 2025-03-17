import PsychologicalAssessment from './assessment-core.js';
import styles from './styles.css';

export default class NineDimensionsExtension {
    constructor() {
        // 扩展元数据
        this.name = '九维心理分析';
        this.version = 4.0;
        this.author = '心理分析中心';
        this.description = '完整实现ICD-11标准的九维度评估系统';
        this.settingsKey = 'nineDimsSettings';
    }

    init(app) {
        this.app = app;
        this.assessment = new PsychologicalAssessment();

        // 注册系统钩子
        this.registerHooks();

        // 注入资源
        this.app.registerCSS(styles);
        this.app.registerExtensionSetting(this.buildSettingsPanel());
    }

    registerHooks() {
        // 消息处理流水线
        this.app.registerHook('chat', 'beforeResponse', (context) => {
            this.assessment.syncSettings(this.getCurrentSettings());
            this.assessment.analyzeMessage(context);
            context.extraHTML = this.assessment.generateReport();
            return context;
        });

        // 上下文更新监听
        this.app.registerHook('context', 'afterReset', () => {
            this.assessment.clearCache();
        });
    }

    buildSettingsPanel() {
        return `
            <div class="nine-dims-settings">
                <!-- 维度1: 基础信息 -->
                <section data-dim="basic">
                    <h4>${this.assessment.getDimensionName(1)}</h4>
                    <div class="grid-2col">
                        <input type="text" data-setting="basicInfo.name" placeholder="姓名">
                        <input type="number" data-setting="basicInfo.age" placeholder="年龄" min="12" max="100">
                    </div>
                </section>

                <!-- 维度2: 生活事件 -->
                <section data-dim="events">
                    <h4>${this.assessment.getDimensionName(2)}</h4>
                    ${[0,1,2].map(i => `
                        <div class="event-item">
                            <input type="text" data-setting="lifeEvents[${i}].time" placeholder="事件${i + 1}时间">
                            <textarea data-setting="lifeEvents[${i}].content" placeholder="事件描述"></textarea>
                        </div>
                    `).join('')}
                </section>

                <!-- 维度3: 心理状态 -->
                <section data-dim="psych-state">
                    <h4>${this.assessment.getDimensionName(3)}</h4>
                    <div class="checklist">
                        ${['焦虑','抑郁','压力'].map(item => `
                            <label>
                                <input type="checkbox" data-setting="currentStatus.emotion" value="${item}">
                                ${item}
                            </label>
                        `).join('')}
                    </div>
                </section>

                <!-- 维度4: 生活状况 -->
                <section data-dim="lifestyle">
                    <h4>${this.assessment.getDimensionName(4)}</h4>
                    <div class="grid-3col">
                        <select data-setting="lifestyle.sleep">
                            <option value="">睡眠质量</option>
                            <option value="优">7小时以上</option>
                            <option value="良">5-7小时</option>
                            <option value="差">不足5小时</option>
                        </select>
                        <input type="text" data-setting="lifestyle.diet" placeholder="饮食习惯">
                        <input type="text" data-setting="lifestyle.exercise" placeholder="运动频率">
                    </div>
                </section>

                <!-- 维度5: 职业发展 -->
                <section data-dim="career">
                    <h4>${this.assessment.getDimensionName(5)}</h4>
                    <div class="grid-2col">
                        <input type="text" data-setting="workStudy.education" placeholder="最高学历">
                        <select data-setting="workStudy.jobSatisfaction">
                            <option value="">工作满意度</option>
                            <option value="高">高度满意</option>
                            <option value="中">一般满意</option>
                            <option value="低">不满意</option>
                        </select>
                    </div>
                </section>

                <!-- 维度6: 家庭关系 -->
                <section data-dim="family">
                    <h4>${this.assessment.getDimensionName(6)}</h4>
                    ${['父亲','母亲','配偶'].map(role => `
                        <div class="family-member">
                            <input type="text" data-setting="familyRelations.${role}.relation" placeholder="${role}关系">
                            <textarea data-setting="familyRelations.${role}.attitude" placeholder="${role}态度"></textarea>
                        </div>
                    `).join('')}
                </section>

                <!-- 维度7: 家庭氛围 -->
                <section data-dim="family-env">
                    <h4>${this.assessment.getDimensionName(7)}</h4>
                    <div class="grid-2col">
                        <select data-setting="familyAtmosphere.parentingStyle">
                            <option value="">教育方式</option>
                            <option value="民主">民主型</option>
                            <option value="权威">权威型</option>
                            <option value="放任">放任型</option>
                        </select>
                        <input type="text" data-setting="familyAtmosphere.majorEvents" placeholder="家庭重大事件">
                    </div>
                </section>

                <!-- 维度8: 咨询经历 -->
                <section data-dim="counseling">
                    <h4>${this.assessment.getDimensionName(8)}</h4>
                    <div class="grid-3col">
                        <input type="number" data-setting="counseling.history" placeholder="咨询次数">
                        <input type="text" data-setting="counseling.duration" placeholder="持续时间">
                        <select data-setting="counseling.effectiveness">
                            <option value="">咨询效果</option>
                            <option value="显著">显著有效</option>
                            <option value="一般">效果一般</option>
                            <option value="无效">没有效果</option>
                        </select>
                    </div>
                </section>

                <!-- 维度9: 价值观 -->
                <section data-dim="values">
                    <h4>${this.assessment.getDimensionName(9)}</h4>
                    <div class="value-grid">
                        <textarea data-setting="values.success" placeholder="对成功的定义"></textarea>
                        <textarea data-setting="values.failure" placeholder="对失败的理解"></textarea>
                        <textarea data-setting="values.love" placeholder="对爱情的看法"></textarea>
                    </div>
                </section>
            </div>
        `;
    }

    getCurrentSettings() {
        return this.app.store.getState().extensionSettings[this.settingsKey] || {};
    }

    onDestroy() {
        this.assessment.cleanup();
        this.app.store.dispatch('extensions/clearSettings', this.settingsKey);
    }
}
