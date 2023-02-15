
export enum Queues {
    dig = 'dig',
    dug = 'dug',
    catalog = 'catalog',
}



export interface ServiceMessage {
    id: string
    serviceId: string
    timestamp: Date

}