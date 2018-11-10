const parseErrors = errors => Object.keys(errors).map(item => errors[item].message);

module.exports = {
    generateErrorResponse: (report) => {
        if (report.errors && report._message){
            return {
                generalMessage: report._message,
                messages: parseErrors(report.errors),
            };
        }
        return{
            generalMessage: 'Something went wrong.',
        }
    }
}