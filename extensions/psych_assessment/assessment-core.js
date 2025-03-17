import nlp from 'compromise';

export default class PsychologicalAssessmentCore {
    constructor() {
        this.data = this.initializeNineDimensions();
        this.settings = {};
        this.nlp = nlp;
        this.translations = this.getTranslations();
    }

    initializeNineDimensions() {
        return {
            // 维度1: 基础信息
            basicInfo: {
                name: '',
                gender: '',
                age: '',
                ethnicity: '',
            },

            // 维度2: 重大生活事件
            lifeEvents: Array(3).fill().map(() => ({
                time: '',
                role: '',
                content: '',
                impact: '',
                coping: '',
                feeling: '',
            })),

            // 维度3: 当前心理状态
            currentStatus: {
                cognition: '',
                emotion: [],
                behavior: '',
                somatic: '',
            },

            // 维度4: 生活状况
            lifestyle: {
                diet: '',
                sleepQuality: '',
                exercise: '',
                medicalHistory: '',
                substanceUse: '',
                socialActivity: '',
            },

            // 维度5: 学习工作
            workStudy: {
                educationLevel: '',
                major: '',
                academicExperience: '',
                jobSatisfaction: 3,
                careerStress: '',
                incomeLevel: '',
                financialPressure: '',
            },

            // 维度6: 家庭关系
            familyRelations: Array(4).fill().map(() => ({
                member: '',
                relation: '',
                attitudeToUser: '',
                userAttitude: '',
                conflictFrequency: '',
            })),

            // 维度7: 家庭氛围
            familyAtmosphere: {
                parentingStyle: '',
                supportLevel: '',
                communicationStyle: '',
                majorEvents: '',
            },

            // 维度8: 咨询经历
            counseling: {
                history: [],
                goals: [],
                experienceEvaluation: '',
                effectiveness: '',
            },

            // 维度9: 价值观
            values: {
                success: '',
                failure: '',
                love: '',
                morality: '',
                lifePurpose: '',
            },
        };
    }

    analyzeText(text) {
        try {
            const doc = this.nlp(text);
            this.captureBasicInfo(text, doc);
            this.captureLifeEvents(text, doc);
            this.captureMentalState(doc);
            this.captureLifestyle(doc);
            this.captureCareerInfo(doc);
            this.captureFamilyRelations(text, doc);
            this.captureFamilyAtmosphere(doc);
            this.captureCounselingHistory(doc);
            this.captureValueSystem(doc);
        } catch (error) {
            console.error('[分析引擎] NLP处理失败:', error);
        }
    }

    captureBasicInfo(text, doc) {
        const ageMatch = text.match(/(?:年龄|今年|岁)[^\d]*(\d+)/);
        if (ageMatch) this.data.basicInfo.age = ageMatch[1];

        const genderTerms = doc.match('#Male+').concat(doc.match('#Female+'));
        if (genderTerms.found) {
            this.data.basicInfo.gender = genderTerms.has('他') ? '男' : '女';
        }
    }

    captureLifeEvents(text, doc) {
        const events = doc.clauses().filter(c =>
            c.has('(事故|离婚|失业|疾病)') &&
            c.has('(发生|经历|遇到)'),
        );

        events.forEach((event, index) => {
            if (index >= 3) return;
            this.data.lifeEvents[index] = {
                time: event.match('(今年|去年|最近)').text(),
                content: event.text(),
                impact: this.analyzeImpact(event),
            };
        });
    }

    captureMentalState(doc) {
        const emotionMap = {
            焦虑: ['焦虑', '紧张', '不安'],
            抑郁: ['抑郁', '低落', '绝望'],
            快乐: ['开心', '愉快', '满足'],
        };

        Object.entries(emotionMap).forEach(([emotion, terms]) => {
            if (doc.has(terms.join('|'))) {
                this.data.currentStatus.emotion.push(emotion);
            }
        });

        const cognitivePatterns = doc.match('(总是认为|觉得|坚信)');
        if (cognitivePatterns.found) {
            this.data.currentStatus.cognition = cognitivePatterns.json()
                .map(m => m.text).join('；');
        }
    }

    captureLifestyle(doc) {
        const sleepTerms = doc.match('(失眠|睡不好|多梦|早醒)');
        this.data.lifestyle.sleepQuality = sleepTerms.found ? '差' : '正常';

        const exerciseMatch = doc.match('(每周|每天) (#Value+次) 运动');
        if (exerciseMatch.found) {
            this.data.lifestyle.exercise = exerciseMatch.groups('value').text();
        }
    }

    captureCareerInfo(doc) {
        const eduLevels = ['博士', '硕士', '本科', '大专'];
        eduLevels.forEach(level => {
            if (doc.has(level)) {
                this.data.workStudy.educationLevel = level;
            }
        });

        const satisfactionTerms = doc.match('(满意|喜欢|讨厌) 工作');
        if (satisfactionTerms.has('满意')) {
            this.data.workStudy.jobSatisfaction = 4;
        } else if (satisfactionTerms.has('讨厌')) {
            this.data.workStudy.jobSatisfaction = 2;
        }
    }

    captureFamilyRelations(text) {
        const familyMap = {
            '父亲': ['爸爸', '爸', '父亲'],
            '母亲': ['妈妈', '妈', '母亲'],
            '配偶': ['丈夫', '妻子', '老公', '老婆'],
        };

        Object.entries(familyMap).forEach(([role, terms]) => {
            if (new RegExp(terms.join('|')).test(text)) {
                const relation = this.data.familyRelations.find(r => r.member === role) || {};
                relation.member = role;
                relation.conflictFrequency = this.calculateConflictFrequency(text);
                this.data.familyRelations.push(relation);
            }
        });
    }

    captureFamilyAtmosphere(doc) {
        const parentingStyles = {
            民主型: ['商量', '讨论', '尊重'],
            权威型: ['必须', '应该', '严格'],
            放任型: ['不管', '随意', '自由'],
        };

        Object.entries(parentingStyles).forEach(([style, terms]) => {
            if (doc.has(terms.join('|'))) {
                this.data.familyAtmosphere.parentingStyle = style;
            }
        });
    }

    captureCounselingHistory(doc) {
        const counselingTerms = doc.match('(心理咨询|治疗|咨询师)');
        if (counselingTerms.found) {
            this.data.counseling.history.push({
                type: '心理咨询',
                duration: doc.match('(持续 #Duration+)').text(),
                effectiveness: this.analyzeEffectiveness(doc),
            });

        }
    }

    captureValueSystem(doc) {
        const valueConcepts = {
            success: '(成功|成就) (是|意味着)',
            failure: '(失败|挫折) (是|意味着)',
            love: '(爱情|婚姻) (是|应该)',
        };

        Object.entries(valueConcepts).forEach(([key, pattern]) => {
            const match = doc.match(pattern);
            if (match.found) {
                this.data.values[key] = match.replace(pattern, '').text();
            }
        });
    }

    generateReport() {
        return `
            <div class="nine-dimensions-report">
                ${this.renderDimension(1, this.data.basicInfo)}
                ${this.renderLifeEvents()}
                ${this.renderDimension(3, this.data.currentStatus)}
                ${this.renderLifestyle()}
                ${this.renderCareer()}
                ${this.renderFamilyRelations()}
                ${this.renderFamilyAtmosphere()}
                ${this.renderCounseling()}
                ${this.renderValues()}
            </div>
        `;
    }

    renderDimension(dimNumber, data) {
        const dimConfig = this.getDimensionConfig(dimNumber);
        return `
            <section class="dimension" data-dim="${dimNumber}">
                <h3>${dimConfig.title}</h3>
                <div class="dim-grid">
                    ${Object.entries(data).map(([key, value]) => `
                        <div class="dim-item">
                            <label>${this.translations[key]}</label>
                            <div>${this.formatValue(value)}</div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    getTranslations() {
        return {
            name: '姓名',
            gender: '性别',
            age: '年龄',
            ethnicity: '民族',
            time: '时间',
            role: '角色',
            content: '内容',
            impact: '影响',
            coping: '应对方式',
            feeling: '感受',
            cognition: '认知状况',
            emotion: '情绪状态',
            behavior: '行为表现',
            somatic: '躯体症状',
            diet: '饮食',
            sleepQuality: '睡眠质量',
            exercise: '运动',
            medicalHistory: '病史',
            substanceUse: '物质使用',
            socialActivity: '社交活动',
            educationLevel: '教育程度',
            major: '专业',
            academicExperience: '学业经历',
            jobSatisfaction: '工作满意度',
            careerStress: '职业压力',
            incomeLevel: '收入水平',
            financialPressure: '经济压力',
            member: '家庭成员',
            relation: '关系',
            attitudeToUser: '对用户态度',
            userAttitude: '用户态度',
            conflictFrequency: '冲突频率',
            parentingStyle: '教育方式',
            supportLevel: '支持程度',
            communicationStyle: '沟通方式',
            majorEvents: '重大事件',
            history: '历史记录',
            goals: '咨询目标',
            experienceEvaluation: '体验评价',
            effectiveness: '咨询效果',
            success: '成功观',
            failure: '失败观',
            love: '爱情观',
            morality: '道德观',
            lifePurpose: '生活目标',
        };
    }

    formatValue(value) {
        if (Array.isArray(value)) return value.join('、') || '无记录';
        if (typeof value === 'object') return JSON.stringify(value);
        return value || '未提及';
    }

    getDimensionConfig(dimNumber) {
        const dimensions = {
            1: { title: '基本信息', icon: '👤' },
            2: { title: '生活事件', icon: '📅' },
            3: { title: '心理状态', icon: '🧠' },
            4: { title: '生活状况', icon: '🏡' },
            5: { title: '职业发展', icon: '💼' },
            6: { title: '家庭关系', icon: '👨👩👧👦' },
            7: { title: '家庭氛围', icon: '❤️' },
            8: { title: '咨询经历', icon: '🩺' },
            9: { title: '价值体系', icon: '💎' },
        };
        return dimensions[dimNumber];
    }

    cleanup() {
        this.data = this.initializeNineDimensions();
    }

    exportData() {
        return JSON.parse(JSON.stringify(this.data));
    }

    importData(data) {
        this.data = { ...this.initializeNineDimensions(), ...data };
    }
}
